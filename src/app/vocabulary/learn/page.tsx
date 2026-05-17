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

  // hydration 安全: SSR 没法读 localStorage,会和客户端首次渲染不一致 → React 报 #425 直接拒绝挂载。
  // 用 mounted gate 保证 SSR 和客户端首屏完全一致(都渲染 loading), 挂载后再读 storage。
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user, bump, setUser } = useDailyTask();
  const activeBook = useMemo(
    () => getActiveBook(user.activeBookId),
    [user.activeBookId]
  );
  const dayWords = useMemo(
    () => (mounted ? getWordsByDay(user.activeBookId, user.currentDay) : []),
    [mounted, user.activeBookId, user.currentDay]
  );

  const [progressMap, setProgressMap] = useState<Record<string, WordProgress>>({});
  const [queue, setQueue] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    const map = storage.getWordProgressMap();
    dayWords.forEach((w) => {
      if (!map[w.id]) map[w.id] = initWordProgress(w.id);
    });
    setProgressMap(map);

    // new 模式: 始终走完整今日 30 个词, 已会的可点"我会了"秒过, 进度条更直观 (1/30 → 30/30)
    // review 模式: 只挑到期复习的, 进度条按到期数算
    const list =
      mode === "new"
        ? dayWords
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, mode, user.activeBookId, user.currentDay, dayWords.length]);

  if (!mounted) {
    return (
      <Container>
        <PageHeader title="单词学习" />
        <Card>
          <p>加载中...</p>
        </Card>
      </Container>
    );
  }

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

  // 进度条永远显示 当前位置 / queue.length, new 模式 queue 就是今日 30 个, 自然得到 1/30
  const totalForBar = queue.length;
  const valueForBar = Math.min(idx + (finished ? 0 : 1), totalForBar);

  const handleAdvanceDay = () => {
    const nextDay = user.currentDay + 1;
    if (nextDay > activeBook.totalDays) {
      alert("已经是这本词书的最后一天了, 没有下一天可以学了。");
      return;
    }
    if (
      !confirm(
        `提前学下一组(Day ${nextDay})? 今日新词进度会继续累加。\n建议:刚学完一组, 可以先去默写/造句巩固, 大脑需要 cooldown。`
      )
    )
      return;
    setUser({ ...user, currentDay: nextDay });
    // setUser 会触发 dayWords useMemo 重算 -> 上面那个 setQueue useEffect 会跑 -> idx 自动归 0
  };

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
        label={mode === "review" ? "本组复习进度" : "今日新词进度"}
        value={valueForBar}
        max={totalForBar}
      />

      {current && currentProgress ? (
        <>
          <WordCard
            word={current}
            progress={currentProgress}
            voice={user.preferences.voice}
            onFeedback={handleFeedback}
          />
          {idx > 0 ? (
            <div className="mt-3 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setIdx(Math.max(0, idx - 1))}
              >
                ← 上一题
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <Card>
          <h3 className="section-title">这一组完成。</h3>
          <p className="mt-1 text-sm muted">
            刚刚学了 {queue.length} 个词。
            {mode === "new"
              ? `建议先去默写一组检验,巩固后再继续。${
                  user.currentDay < activeBook.totalDays
                    ? "状态特别好的话, 也可以提前学下一组。"
                    : "这是这本书的最后一组,完整学完啦 🎉"
                }`
              : "回首页看下一项任务。"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/vocabulary/dictation">
              <Button variant="primary">去默写</Button>
            </Link>
            {mode === "new" && user.currentDay < activeBook.totalDays ? (
              <Button variant="soft" onClick={handleAdvanceDay}>
                继续学下一组 (Day {user.currentDay + 1})
              </Button>
            ) : null}
            <Link href="/">
              <Button variant="ghost">返回首页</Button>
            </Link>
          </div>
        </Card>
      )}
    </Container>
  );
}
