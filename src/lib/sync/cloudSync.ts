"use client";

import { getSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/client";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  finishedAt: number;
}

const TABLE = "user_sync_items";

const ALLOWED_KEYS = new Set<string>(Object.values(STORAGE_KEYS));

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

export async function pushAll(): Promise<{ pushed: number }> {
  const supa = requireSession();
  const userId = await getUserId();
  const snapshot = storage.exportSyncSnapshot();
  const rows = Object.entries(snapshot)
    .filter(([k]) => ALLOWED_KEYS.has(k))
    .map(([key, value]) => ({ user_id: userId, key, value }));

  if (!rows.length) {
    storage.patchSyncMeta({ lastSyncedAt: Date.now(), lastSyncedUserId: userId });
    return { pushed: 0 };
  }

  const { error } = await supa
    .from(TABLE)
    .upsert(rows, { onConflict: "user_id,key" });
  if (error) throw new Error(`上传失败: ${error.message}`);

  storage.patchSyncMeta({ lastSyncedAt: Date.now(), lastSyncedUserId: userId });
  return { pushed: rows.length };
}

export async function pullAll(): Promise<{ pulled: number }> {
  const supa = requireSession();
  const userId = await getUserId();

  const { data, error } = await supa
    .from(TABLE)
    .select("key,value")
    .eq("user_id", userId);
  if (error) throw new Error(`拉取失败: ${error.message}`);
  if (!data || !data.length) {
    storage.patchSyncMeta({ lastSyncedAt: Date.now(), lastSyncedUserId: userId });
    return { pulled: 0 };
  }

  const snapshot: Record<string, unknown> = {};
  for (const row of data) {
    if (!ALLOWED_KEYS.has(row.key)) continue;
    snapshot[row.key] = row.value;
  }
  const { applied } = storage.applySyncSnapshot(snapshot);
  storage.patchSyncMeta({ lastSyncedAt: Date.now(), lastSyncedUserId: userId });
  return { pulled: applied };
}

/**
 * 双向同步策略 (v1.5 简化版):
 * - 服务端有数据 -> 拉下来覆盖本地(因为我们的 SyncMeta 还没记录每个 key 的 modifiedAt)
 * - 然后把合并后的本地全量推回服务端
 *
 * 这版策略对单用户多设备最常见的场景最稳:在 A 设备学完 -> sync(自动 push),
 * 到 B 设备 -> sync(先 pull, 再 push 等于回写,无副作用)。
 * 后续 v1.6 可再做按 key 的 last-write-wins。
 */
export async function syncTwoWay(): Promise<SyncResult> {
  const userId = await getUserId();
  const meta = storage.getSyncMeta();
  const sameUser = meta.lastSyncedUserId === userId;

  let pulled = 0;
  let pushed = 0;

  if (!sameUser || meta.lastSyncedAt === null) {
    // 第一次在该账号上同步: 先拉(避免覆盖云端原有数据), 再推合并结果
    const r1 = await pullAll();
    pulled = r1.pulled;
    const r2 = await pushAll();
    pushed = r2.pushed;
  } else {
    // 已经在同一个账号, 默认认为本地是最新, 先推后拉(拉用于保险, 把云端可能更新的也带回)
    const r1 = await pushAll();
    pushed = r1.pushed;
    const r2 = await pullAll();
    pulled = r2.pulled;
  }

  return {
    pushed,
    pulled,
    conflicts: 0,
    finishedAt: Date.now()
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
