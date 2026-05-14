"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import type { DailyTaskProgress, DailyTaskTargets, UserProgress } from "@/types";
import { todayKey, daysBetween } from "@/lib/utils";

interface UseDailyTaskState {
  user: UserProgress;
  targets: DailyTaskTargets;
  progress: DailyTaskProgress;
  bump: (k: keyof Omit<DailyTaskProgress, "date">, by?: number) => void;
  setUser: (u: UserProgress) => void;
  refresh: () => void;
}

const STORAGE_EVENT = "ielts-wb:storage-updated";

export function notifyStorageUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

export function useDailyTask(): UseDailyTaskState {
  const [user, setUserState] = useState<UserProgress>(() => storage.getUser());
  const [progress, setProgress] = useState<DailyTaskProgress>(() => storage.getDailyProgress());

  useEffect(() => {
    const today = todayKey();
    if (user.lastStudyDate !== today) {
      let streak = user.streakDays;
      if (user.lastStudyDate) {
        const gap = daysBetween(user.lastStudyDate, today);
        if (gap === 1) streak += 1;
        else if (gap > 1) streak = 1;
      } else {
        streak = 1;
      }
      const next: UserProgress = {
        ...user,
        lastStudyDate: today,
        streakDays: streak
      };
      storage.setUser(next);
      setUserState(next);
    }
    setProgress(storage.getDailyProgress());
  }, []);

  useEffect(() => {
    const handler = () => {
      setUserState(storage.getUser());
      setProgress(storage.getDailyProgress());
    };
    const visHandler = () => {
      if (document.visibilityState === "visible") handler();
    };
    window.addEventListener(STORAGE_EVENT, handler);
    window.addEventListener("storage", handler);
    document.addEventListener("visibilitychange", visHandler);
    return () => {
      window.removeEventListener(STORAGE_EVENT, handler);
      window.removeEventListener("storage", handler);
      document.removeEventListener("visibilitychange", visHandler);
    };
  }, []);

  const bump = (k: keyof Omit<DailyTaskProgress, "date">, by = 1) => {
    const next = storage.bumpDailyProgress(k, by);
    setProgress(next);
    notifyStorageUpdated();
  };

  const setUser = (u: UserProgress) => {
    storage.setUser(u);
    setUserState(u);
    notifyStorageUpdated();
  };

  const refresh = () => {
    setUserState(storage.getUser());
    setProgress(storage.getDailyProgress());
  };

  return {
    user,
    targets: user.preferences.targets,
    progress,
    bump,
    setUser,
    refresh
  };
}
