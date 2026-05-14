"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { DailyTaskProgress, DailyTaskTargets, UserProgress } from "@/types";
import { getActiveBook } from "@/data/mockWords";

function totalDone(p: DailyTaskProgress): number {
  return (
    p.newWordsDone +
    p.reviewWordsDone +
    p.dictationDone +
    p.vocabularyArticleDone +
    p.writingSentencesDone +
    p.listeningSessionsDone
  );
}

function totalTarget(t: DailyTaskTargets): number {
  return (
    t.newWords +
    t.reviewWords +
    t.dictation +
    t.vocabularyArticle +
    t.writingSentences +
    t.listeningSessions
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
  const done = totalDone(progress);
  const total = totalTarget(targets);
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
        <div className="text-sm muted">今日完成进度</div>
        <div className="mt-1 text-lg font-semibold tabular-nums">
          {done}/{total}
        </div>
        <ProgressBar className="mt-3" value={done} max={total} />
      </Card>
    </div>
  );
}
