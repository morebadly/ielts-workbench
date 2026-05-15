"use client";

import { getSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/client";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  finishedAt: number;
  /** v1.8 新增: 每个 key 的处理结果 */
  details?: Array<{
    key: string;
    action: "pushed" | "pulled" | "skipped" | "tied";
    reason?: string;
  }>;
}

const TABLE = "user_sync_items";
const ALLOWED_KEYS = new Set<string>(Object.values(STORAGE_KEYS));

interface SyncRow {
  key: string;
  value: unknown;
  client_modified_at?: string | null;
  updated_at?: string | null;
}

function requireSession() {
  const supa = getSupabase();
  if (!supa) throw new SupabaseNotConfiguredError();
  return supa;
}

async function getUserId(): Promise<string> {
  const supa = requireSession();
  const { data, error } = await supa.auth.getUser();
  if (error || !data.user) throw new Error("未登录, 请先登录后再同步");
  return data.user.id;
}

function rowTime(row: SyncRow): number {
  // 优先用客户端记录的修改时间(更精确反映"最后一次有意义的本地写入");
  // 回退到 supabase 自带的 updated_at (旧数据可能没有 client_modified_at)。
  if (row.client_modified_at) {
    const t = Date.parse(row.client_modified_at);
    if (!Number.isNaN(t)) return t;
  }
  if (row.updated_at) {
    const t = Date.parse(row.updated_at);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

export async function pushAll(): Promise<{ pushed: number }> {
  const supa = requireSession();
  const userId = await getUserId();
  const snapshot = storage.exportSyncSnapshot();
  const tsMap = storage.getAllKeyModifiedAt();
  const now = Date.now();

  const rows = Object.entries(snapshot)
    .filter(([k]) => ALLOWED_KEYS.has(k))
    .map(([key, value]) => ({
      user_id: userId,
      key,
      value,
      client_modified_at: new Date(tsMap[key] || now).toISOString()
    }));

  if (!rows.length) {
    storage.patchSyncMeta({ lastSyncedAt: now, lastSyncedUserId: userId });
    return { pushed: 0 };
  }

  const { error } = await supa
    .from(TABLE)
    .upsert(rows, { onConflict: "user_id,key" });
  if (error) throw new Error(`上传失败: ${error.message}`);

  storage.patchSyncMeta({ lastSyncedAt: now, lastSyncedUserId: userId });
  return { pushed: rows.length };
}

export async function pullAll(): Promise<{ pulled: number }> {
  const supa = requireSession();
  const userId = await getUserId();

  const { data, error } = await supa
    .from(TABLE)
    .select("key,value,client_modified_at,updated_at")
    .eq("user_id", userId);
  if (error) throw new Error(`拉取失败: ${error.message}`);
  if (!data || !data.length) {
    storage.patchSyncMeta({ lastSyncedAt: Date.now(), lastSyncedUserId: userId });
    return { pulled: 0 };
  }

  let applied = 0;
  for (const row of data as SyncRow[]) {
    if (!ALLOWED_KEYS.has(row.key)) continue;
    storage.writeRawKey(row.key, row.value);
    storage.setKeyModifiedAt(row.key, rowTime(row) || Date.now());
    applied++;
  }
  // pull 后, 触发一次 storage 事件让 UI 自己刷新
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ielts-wb:sync-applied"));
  }
  storage.patchSyncMeta({ lastSyncedAt: Date.now(), lastSyncedUserId: userId });
  return { pulled: applied };
}

/**
 * 双向同步 (v1.8: per-key last-write-wins)
 *
 * 1. 拉云端这个用户的全部行(连同时间戳)
 * 2. 对每个白名单 key:
 *    - 只云端有 / 云端较新 -> 拉到本地, 本地时间戳=云端时间戳
 *    - 只本地有 / 本地较新 -> 推到云端, 带 client_modified_at
 *    - 时间戳相等 -> tied, 跳过
 * 3. 一次 batch upsert + 多次 raw write
 */
export async function syncTwoWay(): Promise<SyncResult> {
  const supa = requireSession();
  const userId = await getUserId();
  const now = Date.now();

  // 1. 拉云端
  const { data: cloudRows, error: pullErr } = await supa
    .from(TABLE)
    .select("key,value,client_modified_at,updated_at")
    .eq("user_id", userId);
  if (pullErr) throw new Error(`拉取失败: ${pullErr.message}`);

  const cloudByKey = new Map<string, SyncRow>();
  for (const r of (cloudRows || []) as SyncRow[]) {
    if (!ALLOWED_KEYS.has(r.key)) continue;
    cloudByKey.set(r.key, r);
  }

  // 2. 本地全量
  const localSnapshot = storage.exportSyncSnapshot();
  const localTs = storage.getAllKeyModifiedAt();

  const allKeys = new Set<string>([
    ...cloudByKey.keys(),
    ...Object.keys(localSnapshot).filter((k) => ALLOWED_KEYS.has(k))
  ]);

  const toPush: Array<{
    user_id: string;
    key: string;
    value: unknown;
    client_modified_at: string;
  }> = [];
  const details: NonNullable<SyncResult["details"]> = [];
  let pulled = 0;
  let conflicts = 0;

  for (const key of allKeys) {
    const cloud = cloudByKey.get(key);
    const cloudTs = cloud ? rowTime(cloud) : 0;
    const localHas = Object.prototype.hasOwnProperty.call(localSnapshot, key);
    const localTime = localTs[key] || 0;

    if (!cloud) {
      // 只本地有 -> push
      toPush.push({
        user_id: userId,
        key,
        value: localSnapshot[key],
        client_modified_at: new Date(localTime || now).toISOString()
      });
      details.push({ key, action: "pushed", reason: "云端无此 key" });
      continue;
    }

    if (!localHas) {
      // 只云端有 -> pull
      storage.writeRawKey(key, cloud.value);
      storage.setKeyModifiedAt(key, cloudTs || now);
      pulled++;
      details.push({ key, action: "pulled", reason: "本地无此 key" });
      continue;
    }

    // 双方都有 -> 比时间
    if (localTime > cloudTs) {
      toPush.push({
        user_id: userId,
        key,
        value: localSnapshot[key],
        client_modified_at: new Date(localTime).toISOString()
      });
      details.push({
        key,
        action: "pushed",
        reason: `本地较新 (+${Math.round((localTime - cloudTs) / 1000)}s)`
      });
    } else if (cloudTs > localTime) {
      storage.writeRawKey(key, cloud.value);
      storage.setKeyModifiedAt(key, cloudTs);
      pulled++;
      conflicts++;
      details.push({
        key,
        action: "pulled",
        reason: `云端较新 (+${Math.round((cloudTs - localTime) / 1000)}s)`
      });
    } else {
      details.push({ key, action: "tied", reason: "时间一致" });
    }
  }

  // 3. 批量 push
  if (toPush.length) {
    const { error } = await supa
      .from(TABLE)
      .upsert(toPush, { onConflict: "user_id,key" });
    if (error) throw new Error(`上传失败: ${error.message}`);
  }

  // 4. 通知 UI
  if (pulled > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ielts-wb:sync-applied"));
  }

  storage.patchSyncMeta({ lastSyncedAt: Date.now(), lastSyncedUserId: userId });

  return {
    pushed: toPush.length,
    pulled,
    conflicts,
    finishedAt: Date.now(),
    details
  };
}

export async function clearCloudData(): Promise<{ cleared: boolean }> {
  const supa = requireSession();
  const userId = await getUserId();
  const { error } = await supa.from(TABLE).delete().eq("user_id", userId);
  if (error) throw new Error(`清空云端失败: ${error.message}`);
  storage.patchSyncMeta({ lastSyncedAt: null, lastSyncedUserId: null });
  return { cleared: true };
}
