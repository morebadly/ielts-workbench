"use client";

import { useCallback, useEffect, useState } from "react";
import {
  pushAll,
  pullAll,
  syncTwoWay,
  clearCloudData,
  type SyncResult
} from "@/lib/sync/cloudSync";
import { storage } from "@/lib/storage";
import { notifyStorageUpdated } from "@/hooks/useDailyTask";

type Phase = "idle" | "running";

export interface CloudSyncState {
  phase: Phase;
  lastSyncedAt: number | null;
  lastSyncedUserId: string | null;
  lastResult: SyncResult | null;
  error: string | null;
}

export function useCloudSync() {
  const [state, setState] = useState<CloudSyncState>(() => ({
    phase: "idle",
    lastSyncedAt: null,
    lastSyncedUserId: null,
    lastResult: null,
    error: null
  }));

  useEffect(() => {
    const meta = storage.getSyncMeta();
    setState((s) => ({
      ...s,
      lastSyncedAt: meta.lastSyncedAt ?? null,
      lastSyncedUserId: meta.lastSyncedUserId ?? null
    }));
  }, []);

  const refreshMeta = useCallback(() => {
    const meta = storage.getSyncMeta();
    setState((s) => ({
      ...s,
      lastSyncedAt: meta.lastSyncedAt ?? null,
      lastSyncedUserId: meta.lastSyncedUserId ?? null
    }));
  }, []);

  const wrap = useCallback(
    async <T,>(fn: () => Promise<T>, afterRefresh = true): Promise<T | null> => {
      setState((s) => ({ ...s, phase: "running", error: null }));
      try {
        const r = await fn();
        if (afterRefresh) {
          notifyStorageUpdated();
        }
        const meta = storage.getSyncMeta();
        setState((s) => ({
          ...s,
          phase: "idle",
          lastSyncedAt: meta.lastSyncedAt ?? null,
          lastSyncedUserId: meta.lastSyncedUserId ?? null
        }));
        return r;
      } catch (e) {
        setState((s) => ({
          ...s,
          phase: "idle",
          error: (e as Error).message
        }));
        return null;
      }
    },
    []
  );

  const upload = useCallback(async () => {
    return wrap(async () => {
      const r = await pushAll();
      setState((s) => ({
        ...s,
        lastResult: { pushed: r.pushed, pulled: 0, conflicts: 0, finishedAt: Date.now() }
      }));
      return r;
    }, false);
  }, [wrap]);

  const download = useCallback(async () => {
    return wrap(async () => {
      const r = await pullAll();
      setState((s) => ({
        ...s,
        lastResult: { pushed: 0, pulled: r.pulled, conflicts: 0, finishedAt: Date.now() }
      }));
      return r;
    });
  }, [wrap]);

  const sync = useCallback(async () => {
    return wrap(async () => {
      const r = await syncTwoWay();
      setState((s) => ({ ...s, lastResult: r }));
      return r;
    });
  }, [wrap]);

  const wipeCloud = useCallback(async () => {
    return wrap(async () => clearCloudData(), false);
  }, [wrap]);

  return {
    ...state,
    upload,
    download,
    sync,
    wipeCloud,
    refreshMeta
  };
}
