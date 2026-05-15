"use client";

import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressCards } from "@/components/dashboard/ProgressCards";
import { TodayTasks } from "@/components/dashboard/TodayTasks";
import { QuickTargets } from "@/components/dashboard/QuickTargets";
import { TodayNewsCallout } from "@/components/dashboard/TodayNewsCallout";
import { useDailyTask } from "@/hooks/useDailyTask";
import { getTodayNews } from "@/data/news/loader";

export default function HomePage() {
  const { user, targets, progress } = useDailyTask();
  const todayNews = getTodayNews();

  const lastHref = user.lastLocation?.href || "/vocabulary/learn";
  const lastLabel = user.lastLocation?.label || "继续学习单词";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "深夜好,慢慢来。";
    if (h < 11) return "早上好,今天先来一组单词?";
    if (h < 14) return "中午好,十分钟也算学习。";
    if (h < 18) return "下午好,继续推进吧。";
    return "晚上好,把今天的复习收尾一下。";
  })();

  return (
    <Container>
      <PageHeader
        title="今天学点什么"
        subtitle={greeting}
        right={
          <Link href={lastHref}>
            <Button variant="primary">{lastLabel}</Button>
          </Link>
        }
      />

      <ProgressCards user={user} progress={progress} targets={targets} />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <TodayNewsCallout items={todayNews} />
          <TodayTasks targets={targets} progress={progress} />
          <QuickTargets user={user} targets={targets} />
        </div>

        <Card>
          <h3 className="section-title">快捷入口</h3>
          <p className="text-sm muted mt-0.5">不知道学什么时,从这里开始。</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <QuickLink href="/news/today" title="今日新闻" desc="阅读 + 词汇 + 写作" />
            <QuickLink href="/vocabulary" title="单词" desc="按 Day 顺序" />
            <QuickLink href="/writing/guide" title="写作格式指导" desc="范文结构" />
            <QuickLink href="/writing/exam" title="机考模拟" desc="带倒计时" />
            <QuickLink href="/listening/practice" title="听力精听" desc="听写 + 原文" />
            <QuickLink href="/review" title="复习箱" desc="到期复习" />
            <QuickLink href="/settings" title="设置" desc="词书 / 任务量" />
          </div>
        </Card>
      </div>
    </Container>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-black/5 bg-bg-soft/50 px-3 py-3 transition hover:bg-bg-soft"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs muted mt-0.5">{desc}</div>
    </Link>
  );
}
