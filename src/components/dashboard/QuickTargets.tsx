"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DailyTaskTargets, UserProgress } from "@/types";
import { storage } from "@/lib/storage";
import { notifyStorageUpdated } from "@/hooks/useDailyTask";

interface Props {
  user: UserProgress;
  targets: DailyTaskTargets;
}

const ROWS: Array<{ key: keyof DailyTaskTargets; label: string; step: number }> = [
  { key: "reviewWords", label: "今日复习词", step: 5 },
  { key: "dictation", label: "默写练习", step: 5 },
  { key: "vocabularyArticle", label: "词汇文章", step: 1 },
  { key: "writingSentences", label: "写作句子", step: 1 },
  { key: "listeningSessions", label: "听力精听", step: 1 }
];

export function QuickTargets({ user, targets }: Props) {
  const update = (key: keyof DailyTaskTargets, delta: number) => {
    const next = Math.max(0, targets[key] + delta);
    const newUser: UserProgress = {
      ...user,
      preferences: {
        ...user.preferences,
        targets: { ...targets, [key]: next }
      }
    };
    storage.setUser(newUser);
    notifyStorageUpdated();
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="section-title">快捷调节今日目标</h3>
        <span className="text-xs muted">点 +/- 立即生效</span>
      </div>
      <ul className="divide-y divide-black/5">
        {ROWS.map((r) => (
          <li key={r.key} className="flex items-center justify-between py-2">
            <span className="text-sm">{r.label}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-7 w-7 !px-0"
                onClick={() => update(r.key, -r.step)}
                aria-label="减少"
              >
                −
              </Button>
              <span className="w-8 text-center text-sm tabular-nums">{targets[r.key]}</span>
              <Button
                variant="ghost"
                className="h-7 w-7 !px-0"
                onClick={() => update(r.key, +r.step)}
                aria-label="增加"
              >
                +
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
