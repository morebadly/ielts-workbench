"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TOPIC_LABEL } from "@/data/news/loader";
import type { DailyNewsItem } from "@/types";

interface Props {
  items: DailyNewsItem[];
}

export function TodayNewsCallout({ items }: Props) {
  if (!items.length) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="section-title">今日英文新闻</h3>
          <Link href="/news">
            <Button variant="ghost">查看历史</Button>
          </Link>
        </div>
        <p className="mt-2 text-sm muted">
          今天还没有更新, 可手动运行 <code>npm run update:news</code> 或等 GitHub Actions 自动拉取。
        </p>
      </Card>
    );
  }
  const first = items[0];
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">今日英文新闻</h3>
          <p className="text-xs muted mt-0.5">
            精选 {items.length} 条 · 阅读 / 词汇 / 写作 / 听力一站式
          </p>
        </div>
        <Link href="/news/today">
          <Button variant="primary">开始今日学习</Button>
        </Link>
      </div>
      <div className="mt-3 rounded-xl border border-black/5 bg-bg-soft/50 px-3 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs muted">
          <span className="pill bg-brand-100 text-brand-700">
            {TOPIC_LABEL[first.topic] || first.topic}
          </span>
          <span>{first.source}</span>
        </div>
        <div className="mt-1 line-clamp-2 text-sm font-medium">{first.title}</div>
      </div>
    </Card>
  );
}
