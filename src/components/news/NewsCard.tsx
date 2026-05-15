import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TOPIC_LABEL } from "@/data/news/loader";
import type { DailyNewsItem } from "@/types";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

export function NewsCard({
  item,
  href = "/news/today",
  compact = false
}: {
  item: DailyNewsItem;
  href?: string;
  compact?: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <span className="pill bg-brand-100 text-brand-700">
          {TOPIC_LABEL[item.topic] || item.topic}
        </span>
        <span className="text-xs muted">{item.source}</span>
        <span className="text-xs muted">·</span>
        <span className="text-xs muted">{formatDate(item.publishedAt)}</span>
      </div>
      <h3 className="mt-2 text-base font-semibold leading-snug">{item.title}</h3>
      {!compact ? (
        <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
          {item.learningSummary}
        </p>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-700 hover:underline"
        >
          原文 ↗
        </a>
        <Link href={href}>
          <Button variant="soft">开始学习</Button>
        </Link>
      </div>
    </Card>
  );
}
