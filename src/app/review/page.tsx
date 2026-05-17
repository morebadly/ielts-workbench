"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage";
import { isDueForReview } from "@/lib/srs";
import { getEnabledBookIds, getWordsFromBooks } from "@/data/mockWords";
import { speak } from "@/lib/tts";
import type { ReviewItem, Word, WordProgress } from "@/types";
import { WORD_STATUS_LABEL } from "@/types";
import { ChineseMeaningParts } from "@/components/vocabulary/ChineseMeaningParts";

export default function ReviewPage() {
  const [dueWords, setDueWords] = useState<
    Array<{ progress: WordProgress; word: Word }>
  >([]);
  const [extras, setExtras] = useState<ReviewItem[]>([]);
  const [bookCount, setBookCount] = useState(0);

  useEffect(() => {
    const user = storage.getUser();
    const enabledIds = getEnabledBookIds(user);
    setBookCount(enabledIds.length);
    const enabledWords = getWordsFromBooks(enabledIds);
    const wordMap = new Map(enabledWords.map((w) => [w.id, w]));
    const map = storage.getWordProgressMap();
    const list = Object.values(map)
      .filter((p) => isDueForReview(p))
      .map((p) => ({ progress: p, word: wordMap.get(p.wordId) }))
      .filter(
        (x): x is { progress: WordProgress; word: Word } => Boolean(x.word)
      )
      .sort(
        (a, b) =>
          (a.progress.nextReviewAt || 0) - (b.progress.nextReviewAt || 0)
      );
    setDueWords(list);
    setExtras(
      storage.getReviewItems().filter((r) => r.due <= Date.now())
    );
  }, []);

  return (
    <Container>
      <PageHeader
        title="复习箱"
        subtitle={`共 ${dueWords.length} 个单词到期复习,${extras.length} 条其他到期项${bookCount > 1 ? ` · 来自 ${bookCount} 本词书` : ""}`}
        right={
          <Link href="/vocabulary/learn?mode=review">
            <Button variant="primary">开始复习单词</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <h3 className="section-title">到期单词</h3>
        {dueWords.length === 0 ? (
          <p className="mt-2 text-sm muted">
            目前没有到期单词。继续学新词,或明天再来。
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {dueWords.slice(0, 30).map(({ word, progress }) => (
              <li key={word.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-medium">
                    {word.word}{" "}
                    <span className="ml-1 text-xs text-ink-muted">{word.phonetic}</span>
                  </div>
                  <div className="text-xs muted">
                    <ChineseMeaningParts text={word.chineseMeaning} compact /> ·{" "}
                    {WORD_STATUS_LABEL[progress.status]} · 错 {progress.wrongCount} 次
                  </div>
                </div>
                <Button variant="soft" onClick={() => speak(word.word)}>
                  ▶
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="section-title">其他来源</h3>
        {extras.length === 0 ? (
          <p className="mt-2 text-sm muted">还没有从听力 / 写作错题加进来的复习项。</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {extras.map((it) => (
              <li key={it.id} className="py-2.5 text-sm">
                <span className="pill mr-2">{it.type}</span>
                {it.type === "examQuestion" ? (
                  <ExamQuestionExtraRow item={it} />
                ) : (
                  <span>{JSON.stringify(it.payload)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}

function ExamQuestionExtraRow({ item }: { item: ReviewItem }) {
  const p = (item.payload || {}) as {
    testName?: string;
    module?: string;
    questionNumber?: number;
    prompt?: string;
    userAnswer?: string;
    correctAnswer?: string;
  };
  return (
    <span className="muted">
      <strong className="text-ink">{p.testName}</strong>
      {p.module ? ` · ${p.module === "reading" ? "阅读" : "听力"}` : ""}
      {p.questionNumber ? ` Q${p.questionNumber}` : ""}
      {p.correctAnswer ? (
        <>
          {" · 正确答案: "}
          <span className="text-emerald-700">{p.correctAnswer}</span>
        </>
      ) : null}
      {p.userAnswer !== undefined && p.userAnswer !== "" ? (
        <>
          {" / 你的答案: "}
          <span className="text-rose-700">{p.userAnswer}</span>
        </>
      ) : null}
    </span>
  );
}
