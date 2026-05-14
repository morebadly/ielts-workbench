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

  const bump = (k: keyof Omit<DailyTaskProgress, "date">, by = 1) => {
    const next = storage.bumpDailyProgress(k, by);
    setProgress(next);
  };

  const setUser = (u: UserProgress) => {
    storage.setUser(u);
    setUserState(u);
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
