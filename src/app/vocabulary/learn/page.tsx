"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WordCard } from "@/components/vocabulary/WordCard";
import { getWordsByDay, getActiveBook } from "@/data/mockWords";
import { storage } from "@/lib/storage";
import { initWordProgress, isDueForReview } from "@/lib/srs";
import { useDailyTask } from "@/hooks/useDailyTask";
import type { Word, WordProgress } from "@/types";

type Mode = "new" | "review";

export default function VocabularyLearnPage() {
  return (
    <Suspense fallback={null}>
      <VocabularyLearnInner />
    </Suspense>
  );
}

function VocabularyLearnInner() {
  const params = useSearchParams();
  const mode: Mode = params.get("mode") === "review" ? "review" : "new";

  const { user, bump, setUser } = useDailyTask();
  const activeBook = useMemo(
    () => getActiveBook(user.activeBookId),
    [user.activeBookId]
  );
  const dayWords = useMemo(
    () => getWordsByDay(user.activeBookId, user.currentDay),
    [user.activeBookId, user.currentDay]
  );

  const [progressMap, setProgressMap] = useState<Record<string, WordProgress>>({});
  const [queue, setQueue] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const map = storage.getWordProgressMap();
    dayWords.forEach((w) => {
      if (!map[w.id]) map[w.id] = initWordProgress(w.id);
    });
    setProgressMap(map);

    const list =
      mode === "new"
        ? dayWords.filter((w) => map[w.id].status === "new" || map[w.id].status === "seen")
        : dayWords.filter((w) => isDueForReview(map[w.id]));
    setQueue(list.length ? list : dayWords);
    setIdx(0);

    setUser({
      ...user,
      lastLocation: {
        label: mode === "review" ? "继续复习单词" : "继续学习单词",
        href: `/vocabulary/learn?mode=${mode}`
      }
    });
  }, [mode, user.activeBookId, user.currentDay]);

  if (queue.length === 0) {
    return (
      <Container>
        <PageHeader title="单词学习" />
        <Card>
          <p>这一天的单词还没准备好。</p>
        </Card>
      </Container>
    );
  }

  const finished = idx >= queue.length;
  const current = !finished ? queue[idx] : null;
  const currentProgress = current
    ? progressMap[current.id] || initWordProgress(current.id)
    : null;

  const handleFeedback = (next: WordProgress) => {
    if (!current) return;
    storage.setWordProgress(next);
    setProgressMap((m) => ({ ...m, [current.id]: next }));
    if (mode === "new" && next.status !== "new") {
      bump("newWordsDone");
    } else if (mode === "review") {
      bump("reviewWordsDone");
    }
    if (idx + 1 < queue.length) {
      setIdx(idx + 1);
    } else {
      const totalLearned = Object.values({ ...progressMap, [current.id]: next }).filter(
        (p) => p.status !== "new"
      ).length;
      setUser({ ...user, totalWordsLearned: totalLearned });
      setIdx(queue.length);
    }
  };

  return (
    <Container>
      <PageHeader
        title={mode === "review" ? "复习今日单词" : "学习今日新词"}
        subtitle={`${activeBook.name} · Day ${user.currentDay}${current ? ` · ${current.wordList}` : ""}`}
        right={
          <Link href="/vocabulary">
            <Button variant="ghost">返回单词首页</Button>
          </Link>
        }
      />
      <ProgressBar
        className="mb-4"
        showLabel
        label="本组进度"
        value={Math.min(idx + (finished ? 0 : 1), queue.length)}
        max={queue.length}
      />

      {current && currentProgress ? (
        <WordCard
          word={current}
          progress={currentProgress}
          voice={user.preferences.voice}
          onFeedback={handleFeedback}
        />
      ) : (
        <Card>
          <h3 className="section-title">这一组完成。</h3>
          <p className="mt-1 text-sm muted">
            刚刚学了 {queue.length} 个词。可以去默写一组检验,或回首页看下一项任务。
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/vocabulary/dictation">
              <Button variant="primary">去默写</Button>
            </Link>
            <Link href="/">
              <Button variant="soft">返回首页</Button>
            </Link>
          </div>
        </Card>
      )}
    </Container>
  );
}
