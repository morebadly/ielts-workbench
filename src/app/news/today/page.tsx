"use client";

import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NewsLearningPanel } from "@/components/news/NewsLearningPanel";
import { getTodayNews } from "@/data/news/loader";
import { useDailyTask } from "@/hooks/useDailyTask";

export default function TodayNewsPage() {
  const items = getTodayNews();
  const { user } = useDailyTask();
  const voice = user.preferences.voice;

  return (
    <Container>
      <PageHeader
        title="今日新闻学习"
        subtitle={`今天精选 ${items.length} 条新闻, 一站式完成阅读 / 词汇 / 写作 / 听力练习`}
        right={
          <div className="flex gap-2">
            <Link href="/news">
              <Button variant="ghost">所有新闻</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">返回首页</Button>
            </Link>
          </div>
        }
      />

      {items.length === 0 ? (
        <Card>
          <h3 className="section-title">今日还没有更新</h3>
          <p className="mt-2 text-sm muted">
            可以手动运行 <code>npm run update:news</code> 拉取最新内容,或等待 GitHub Actions 每天 7:00(北京时间)自动更新。
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {items.map((item) => (
            <NewsLearningPanel key={item.id} item={item} voice={voice} />
          ))}
        </div>
      )}
    </Container>
  );
}
