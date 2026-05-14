"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { DailyTaskProgress, DailyTaskTargets } from "@/types";

interface TaskRow {
  key: keyof Omit<DailyTaskProgress, "date">;
  label: string;
  href: string;
}

const ROWS: TaskRow[] = [
  { key: "newWordsDone", label: "今日新词", href: "/vocabulary/learn?mode=new" },
  { key: "reviewWordsDone", label: "今日复习词", href: "/vocabulary/learn?mode=review" },
  { key: "dictationDone", label: "默写练习", href: "/vocabulary/dictation" },
  { key: "vocabularyArticleDone", label: "今日词汇语境文章", href: "/vocabulary/article" },
  { key: "writingSentencesDone", label: "写作句子训练", href: "/writing/sentence" },
  { key: "listeningSessionsDone", label: "听力精听", href: "/listening/practice" }
];

const TARGET_KEY: Record<TaskRow["key"], keyof DailyTaskTargets> = {
  newWordsDone: "newWords",
  reviewWordsDone: "reviewWords",
  dictationDone: "dictation",
  vocabularyArticleDone: "vocabularyArticle",
  writingSentencesDone: "writingSentences",
  listeningSessionsDone: "listeningSessions"
};

export function TodayTasks({
  targets,
  progress
}: {
  targets: DailyTaskTargets;
  progress: DailyTaskProgress;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-black/5 px-5 py-4">
        <h3 className="section-title">今日学习任务</h3>
        <p className="text-sm muted mt-0.5">点击任意一项,直接进入学习。</p>
      </div>
      <ul className="divide-y divide-black/5">
        {ROWS.map((r) => {
          const target = targets[TARGET_KEY[r.key]];
          const done = progress[r.key];
          const finished = done >= target;
          return (
            <li key={r.key}>
              <Link
                href={r.href}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-bg-soft/60"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      finished
                        ? "grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-600 text-sm"
                        : "grid h-7 w-7 place-items-center rounded-full bg-bg-soft text-ink-muted text-sm"
                    }
                  >
                    {finished ? "✓" : ""}
                  </span>
                  <span className="text-sm">{r.label}</span>
                </div>
                <span className="text-sm tabular-nums text-ink-soft">
                  {done}/{target}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
