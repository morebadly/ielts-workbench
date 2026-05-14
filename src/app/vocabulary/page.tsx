"use client";

import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { getActiveBook } from "@/data/mockWords";
import { useDailyTask } from "@/hooks/useDailyTask";

const ENTRIES = [
  { href: "/vocabulary/learn", title: "单词卡片学习", desc: "按 Day 顺序学词、复习" },
  { href: "/vocabulary/dictation", title: "默写练习", desc: "听音 / 中译英 / 挖空 / 听句" },
  { href: "/vocabulary/article", title: "今日词汇文章", desc: "在语境中复现今日词" },
  { href: "/vocabulary/import", title: "导入词汇书", desc: "上传 PDF 自动提取整理" }
];

export default function VocabularyHome() {
  const { user } = useDailyTask();
  const book = getActiveBook(user.activeBookId);
  return (
    <Container>
      <PageHeader
        title="单词"
        subtitle={`当前词书:${book.name} · 共 ${book.totalDays} 天 · 学到 Day ${user.currentDay}`}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ENTRIES.map((e) => (
          <Link key={e.href} href={e.href}>
            <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
              <h3 className="section-title">{e.title}</h3>
              <p className="mt-1 text-sm muted">{e.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
