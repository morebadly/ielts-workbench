"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { DailyTaskProgress, DailyTaskTargets, UserProgress } from "@/types";
import { getActiveBook } from "@/data/mockWords";

const TASK_PAIRS: Array<{
  doneKey: keyof Omit<DailyTaskProgress, "date">;
  targetKey: keyof DailyTaskTargets;
}> = [
  { doneKey: "newWordsDone", targetKey: "newWords" },
  { doneKey: "reviewWordsDone", targetKey: "reviewWords" },
  { doneKey: "dictationDone", targetKey: "dictation" },
  { doneKey: "vocabularyArticleDone", targetKey: "vocabularyArticle" },
  { doneKey: "writingSentencesDone", targetKey: "writingSentences" },
  { doneKey: "listeningSessionsDone", targetKey: "listeningSessions" }
];

/** 已完成的任务项数 (单位: 项, 不是词) — 任意一项 done >= target 视为完成 */
function countDoneTasks(p: DailyTaskProgress, t: DailyTaskTargets): number {
  return TASK_PAIRS.reduce((acc, { doneKey, targetKey }) => {
    const target = t[targetKey];
    if (target <= 0) return acc; // 目标 0 的任务直接当作不计入
    return acc + (p[doneKey] >= target ? 1 : 0);
  }, 0);
}

function countActiveTasks(t: DailyTaskTargets): number {
  return TASK_PAIRS.reduce(
    (acc, { targetKey }) => acc + (t[targetKey] > 0 ? 1 : 0),
    0
  );
}

export function ProgressCards({
  user,
  progress,
  targets
}: {
  user: UserProgress;
  progress: DailyTaskProgress;
  targets: DailyTaskTargets;
}) {
  const done = countDoneTasks(progress, targets);
  const total = countActiveTasks(targets);
  const book = getActiveBook(user.activeBookId);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card>
        <div className="text-sm muted">词汇书进度</div>
        <div className="mt-1 text-lg font-semibold">
          {book.name} · Day {user.currentDay}/{book.totalDays}
        </div>
        <ProgressBar
          className="mt-3"
          value={user.currentDay}
          max={book.totalDays}
        />
      </Card>

      <Card>
        <div className="text-sm muted">连续学习</div>
        <div className="mt-1 text-lg font-semibold">{user.streakDays} 天</div>
        <div className="mt-3 text-xs muted">
          今天已是连续学习第 {user.streakDays} 天,继续保持。
        </div>
      </Card>

      <Card>
        <div className="text-sm muted">今日完成项</div>
        <div className="mt-1 text-lg font-semibold tabular-nums">
          {done}/{total} 项
        </div>
        <ProgressBar className="mt-3" value={done} max={total} />
      </Card>
    </div>
  );
}
