"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  pushAll,
  pullAll,
  syncTwoWay,
  clearCloudData,
  type SyncResult
} from "@/lib/sync/cloudSync";
import { storage, type SyncMeta } from "@/lib/storage";

type Action = "idle" | "push" | "pull" | "sync" | "clear";

function formatTime(t: number | null) {
  if (!t) return "从未";
  try {
    return new Date(t).toLocaleString("zh-CN");
  } catch {
    return String(t);
  }
}

export function SyncCard() {
  const { configured, user } = useAuth();
  const [action, setAction] = useState<Action>("idle");
  const [meta, setMeta] = useState<SyncMeta>(() => storage.getSyncMeta());
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setMeta(storage.getSyncMeta());
  }, [user?.id]);

  if (!configured) {
    return (
      <Card>
        <h3 className="section-title">云同步</h3>
        <p className="mt-1 text-xs muted">
          需要先在 <code>.env.local</code> 配置 Supabase 才能启用。
        </p>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <h3 className="section-title">云同步</h3>
        <p className="mt-1 text-xs muted">登录后这里会显示同步按钮。</p>
      </Card>
    );
  }

  const run = async (kind: Exclude<Action, "idle">) => {
    setAction(kind);
    setMessage(null);
    try {
      if (kind === "push") {
        const r = await pushAll();
        setMessage({ kind: "ok", text: `已上传 ${r.pushed} 项到云端` });
      } else if (kind === "pull") {
        const r = await pullAll();
        setMessage({
          kind: "ok",
          text:
            r.pulled === 0
              ? "云端暂无数据"
              : `已从云端覆盖本地 ${r.pulled} 项, 即将刷新页面`
        });
        if (r.pulled > 0) setTimeout(() => window.location.reload(), 1500);
      } else if (kind === "sync") {
        const r = await syncTwoWay();
        setLastResult(r);
        setMessage({
          kind: "ok",
          text: `同步完成: 上传 ${r.pushed} 项, 拉取 ${r.pulled} 项`
        });
        if (r.pulled > 0) setTimeout(() => window.location.reload(), 1500);
      } else if (kind === "clear") {
        await clearCloudData();
        setConfirmClear(false);
        setMessage({ kind: "ok", text: "云端数据已清空, 本地数据保留" });
      }
      setMeta(storage.getSyncMeta());
    } catch (e) {
      setMessage({ kind: "err", text: (e as Error).message });
    } finally {
      setAction("idle");
    }
  };

  const busy = action !== "idle";

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="section-title">云同步</h3>
        <span
          className={
            meta.lastSyncedAt
              ? "pill bg-brand-100 text-brand-700"
              : "pill bg-bg-soft text-ink-soft"
          }
        >
          上次同步: {formatTime(meta.lastSyncedAt)}
        </span>
      </div>
      <p className="mt-1 text-xs muted">
        本地学习数据始终保留。点击「同步」将本地与云端合并(本地为主, 云端无的填回云端;
        换设备时点「下载」覆盖本地)。
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => run("sync")} disabled={busy}>
          {action === "sync" ? "同步中..." : "↻ 同步"}
        </Button>
        <Button variant="soft" onClick={() => run("push")} disabled={busy}>
          {action === "push" ? "上传中..." : "↑ 上传本机数据"}
        </Button>
        <Button variant="soft" onClick={() => run("pull")} disabled={busy}>
          {action === "pull" ? "下载中..." : "↓ 下载到本机"}
        </Button>
      </div>

      {lastResult ? (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-bg-soft p-2">
              <div className="muted">推</div>
              <div className="text-base font-semibold">{lastResult.pushed}</div>
            </div>
            <div className="rounded-lg bg-bg-soft p-2">
              <div className="muted">拉</div>
              <div className="text-base font-semibold">{lastResult.pulled}</div>
            </div>
            <div className="rounded-lg bg-bg-soft p-2">
              <div className="muted">冲突</div>
              <div className="text-base font-semibold">{lastResult.conflicts}</div>
            </div>
          </div>
          {lastResult.details && lastResult.details.length > 0 ? (
            <details className="mt-2 rounded-lg border border-black/5 p-2 text-xs">
              <summary className="cursor-pointer muted">
                查看每个 key 的处理结果 ({lastResult.details.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {lastResult.details.map((d) => (
                  <li
                    key={d.key}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <code className="truncate text-ink-soft">{d.key}</code>
                    <span
                      className={
                        d.action === "pushed"
                          ? "pill bg-brand-50 text-brand-700"
                          : d.action === "pulled"
                            ? "pill bg-amber-100 text-amber-700"
                            : "pill bg-bg-soft text-ink-soft"
                      }
                    >
                      {d.action}
                      {d.reason ? ` · ${d.reason}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      ) : null}

      {message ? (
        <div
          className={
            message.kind === "ok"
              ? "mt-3 rounded-lg bg-brand-50 p-2 text-xs text-brand-700"
              : "mt-3 rounded-lg bg-accent-rose/10 p-2 text-xs text-accent-rose"
          }
        >
          {message.kind === "ok" ? "✓ " : "✗ "}
          {message.text}
        </div>
      ) : null}

      <div className="mt-4 border-t border-black/5 pt-3">
        <div className="text-xs muted">危险区</div>
        {!confirmClear ? (
          <Button
            variant="ghost"
            className="mt-1 text-accent-rose"
            onClick={() => setConfirmClear(true)}
          >
            清空云端数据(仅当前账号)
          </Button>
        ) : (
          <div className="mt-1 flex gap-2">
            <Button onClick={() => run("clear")} disabled={busy}>
              确认清空
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              取消
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
