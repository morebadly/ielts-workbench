"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeader } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { NewsLearningPanel } from "@/components/news/NewsLearningPanel";
import { getNewsById } from "@/data/news/loader";
import { useDailyTask } from "@/hooks/useDailyTask";

export default function NewsDetailPage({
  params
}: {
  params: { id: string };
}) {
  const item = getNewsById(params.id);
  const { user } = useDailyTask();

  if (!item) return notFound();

  return (
    <Container>
      <PageHeader
        title={item.title}
        subtitle="单条新闻学习视图"
        right={
          <Link href="/news">
            <Button variant="ghost">返回新闻列表</Button>
          </Link>
        }
      />
      <NewsLearningPanel item={item} voice={user.preferences.voice} />
    </Container>
  );
}
