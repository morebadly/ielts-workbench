"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage";
import type { DailyNewsItem, DailyNewsVocabItem, ReviewItem } from "@/types";

interface Props {
  newsId: string;
  newsTitle: string;
  vocabulary: DailyNewsVocabItem[];
}

export function NewsVocabularyList({ newsId, newsTitle, vocabulary }: Props) {
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const addToReview = (v: DailyNewsVocabItem) => {
    const id = `news-${newsId}-${v.word.toLowerCase().replace(/\s+/g, "-")}`;
    const item: ReviewItem = {
      id,
      type: "newsVocab",
      refId: id,
      payload: {
        word: v.word,
        meaning: v.meaning,
        example: v.example,
        newsId,
        newsTitle
      },
      due: Date.now() + 24 * 60 * 60 * 1000,
      ease: 2.5,
      interval: 1
    };
    storage.upsertReviewItem(item);
    setAdded((p) => ({ ...p, [v.word]: true }));
  };

  if (!vocabulary.length) return null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="section-title">今日词汇</h3>
        <span className="text-xs muted">点击可加入复习箱</span>
      </div>
      <ul className="mt-3 divide-y divide-black/5">
        {vocabulary.map((v) => (
          <li key={v.word} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:gap-3">
            <div>
              <div className="font-semibold">{v.word}</div>
              <div className="text-xs muted">{v.meaning}</div>
            </div>
            <p className="text-sm text-ink-soft">{v.example}</p>
            <Button
              variant={added[v.word] ? "ghost" : "soft"}
              onClick={() => addToReview(v)}
              disabled={added[v.word]}
            >
              {added[v.word] ? "已加入复习箱" : "+ 复习箱"}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
