import type { DailyNewsItem } from "@/types";
import dailyNews from "@/data/news/daily-news.json";

interface NewsFile {
  version: number;
  updatedAt: string;
  items: DailyNewsItem[];
}

const file = dailyNews as NewsFile;

export function getAllNews(): DailyNewsItem[] {
  return [...file.items].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1
  );
}

function todayLocalKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayNews(): DailyNewsItem[] {
  const today = todayLocalKey();
  const exact = file.items.filter((n) => n.date === today);
  if (exact.length) return exact;
  // fallback: 拿最新一天的全部
  const sorted = [...file.items].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1
  );
  if (!sorted.length) return [];
  const latestDate = sorted[0].date;
  return sorted.filter((n) => n.date === latestDate);
}

export function getNewsById(id: string): DailyNewsItem | undefined {
  return file.items.find((n) => n.id === id);
}

export const TOPIC_LABEL: Record<string, string> = {
  education: "教育",
  technology: "科技",
  environment: "环境",
  society: "社会",
  health: "健康",
  work: "职场"
};
