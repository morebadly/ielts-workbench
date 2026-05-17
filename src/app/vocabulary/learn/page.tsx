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
  // v1.10.5: 支持 ?day=N 选学/复习指定 Day, 用于回顾或预习
  // 不传或非法时 fallback 到 user.currentDay
  const dayParamRaw = params.get("day");
  const dayOverride = dayParamRaw ? parseInt(dayParamRaw, 10) : NaN;

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

  // 实际要学的那一天: ?day=N 优先(钳制到 1..totalDays), 否则跟随 user.currentDay
  const effectiveDay = useMemo(() => {
    if (Number.isFinite(dayOverride) && dayOverride >= 1 && dayOverride <= activeBook.totalDays) {
      return dayOverride;
    }
    return user.currentDay;
  }, [dayOverride, user.currentDay, activeBook.totalDays]);

  // 是否处于"回顾/预习"模式 — 此时不计入今日新词进度, 避免污染 daily target
  const isOffDay = effectiveDay !== user.currentDay;

  const dayWords = useMemo(
    () => (mounted ? getWordsByDay(user.activeBookId, effectiveDay) : []),
    [mounted, user.activeBookId, effectiveDay]
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
        href: isOffDay
          ? `/vocabulary/learn?mode=${mode}&day=${effectiveDay}`
          : `/vocabulary/learn?mode=${mode}`
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, mode, user.activeBookId, effectiveDay, dayWords.length]);

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
    const nextDay = effectiveDay + 1;
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
    const prev = progressMap[current.id];
    storage.setWordProgress(next);
    setProgressMap((m) => ({ ...m, [current.id]: next }));
    // 只在 "首次从未学过 -> 已学过" 这一刻计数, 避免重复学同一个词被反复 +1
    // v1.10.5: 回顾/预习其他 Day 时不计入 daily targets, 避免污染今日完成度
    const wasNew = !prev || prev.status === "new";
    const isLearned = next.status !== "new";
    if (!isOffDay) {
      if (mode === "new" && wasNew && isLearned) {
        bump("newWordsDone");
      } else if (mode === "review") {
        bump("reviewWordsDone");
      }
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
        subtitle={`${activeBook.name} · Day ${effectiveDay}${current ? ` · ${current.wordList}` : ""}${isOffDay ? " · 回顾模式" : ""}`}
        right={
          <Link href="/vocabulary">
            <Button variant="ghost">返回单词首页</Button>
          </Link>
        }
      />
      <DaySwitcher
        totalDays={activeBook.totalDays}
        currentDay={user.currentDay}
        effectiveDay={effectiveDay}
        mode={mode}
      />
      {isOffDay ? (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          ⏪ 当前在回顾 / 预习 <b>Day {effectiveDay}</b>。学习进度不会计入今天的"新词完成"。
          <Link href={`/vocabulary/learn?mode=${mode}`} className="ml-2 underline">
            回到 Day {user.currentDay}
          </Link>
        </div>
      ) : null}
      <ProgressBar
        className="mb-4"
        showLabel
        label={mode === "review" ? "本组复习进度" : isOffDay ? `Day ${effectiveDay} 回顾进度` : "今日新词进度"}
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
                  effectiveDay < activeBook.totalDays
                    ? "状态特别好的话, 也可以提前学下一组。"
                    : "这是这本书的最后一组,完整学完啦 🎉"
                }`
              : "回首页看下一项任务。"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/vocabulary/dictation">
              <Button variant="primary">去默写</Button>
            </Link>
            {mode === "new" && effectiveDay < activeBook.totalDays ? (
              isOffDay ? (
                <Link href={`/vocabulary/learn?mode=new&day=${effectiveDay + 1}`}>
                  <Button variant="soft">继续看下一组 (Day {effectiveDay + 1})</Button>
                </Link>
              ) : (
                <Button variant="soft" onClick={handleAdvanceDay}>
                  继续学下一组 (Day {user.currentDay + 1})
                </Button>
              )
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

/**
 * v1.10.5: Day 切换器, 可以跳到任意一天回顾或预习。
 * - 当前学到的 Day 高亮(主色)
 * - 选中的 effectiveDay 描边(可能跟当前学到的同一天 = 没切换)
 * - 移动端用 select, 桌面端用 chip 横向滚动
 */
function DaySwitcher({
  totalDays,
  currentDay,
  effectiveDay,
  mode
}: {
  totalDays: number;
  currentDay: number;
  effectiveDay: number;
  mode: Mode;
}) {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const buildHref = (d: number) =>
    d === currentDay
      ? `/vocabulary/learn?mode=${mode}`
      : `/vocabulary/learn?mode=${mode}&day=${d}`;

  return (
    <div className="mb-3 rounded-xl border border-black/5 bg-bg-card p-2">
      {/* 移动端: 紧凑 select, 不占太高 */}
      <div className="flex items-center gap-2 sm:hidden">
        <span className="shrink-0 text-xs muted">选择 Day</span>
        <select
          className="input h-8 flex-1 text-xs"
          value={effectiveDay}
          onChange={(e) => {
            const d = parseInt(e.target.value, 10);
            if (Number.isFinite(d)) {
              window.location.href = buildHref(d);
            }
          }}
        >
          {days.map((d) => (
            <option key={d} value={d}>
              Day {d}
              {d === currentDay ? " (学到这里)" : ""}
            </option>
          ))}
        </select>
      </div>
      {/* 桌面端: 横向 chip 列表, 自动滚动 */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="shrink-0 text-xs muted">Day</span>
        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
          {days.map((d) => {
            const isEffective = d === effectiveDay;
            const isToday = d === currentDay;
            const cls = isEffective
              ? "shrink-0 rounded-md bg-brand-500 px-2.5 py-1 text-xs font-medium text-white"
              : isToday
                ? "shrink-0 rounded-md border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                : "shrink-0 rounded-md border border-black/5 bg-bg-soft/50 px-2.5 py-1 text-xs text-ink-soft hover:bg-bg-soft";
            return (
              <Link key={d} href={buildHref(d)} className={cls} aria-label={`切到 Day ${d}`}>
                {d}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
