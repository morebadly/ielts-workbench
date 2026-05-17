"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuestionGroupBlock } from "@/components/testBank/QuestionGroupBlock";
import { getTestById } from "@/data/testBank";
import {
  flattenListeningQuestions,
  flattenReadingQuestions,
  isCorrect,
  TEST_BANK_BASE
} from "@/lib/testBank";
import { storage } from "@/lib/storage";
import type { ExamAttempt, ExamQuestion, ReviewItem } from "@/types";

interface Props {
  params: Promise<{ id: string; attemptId: string }>;
}

export default function ResultPage({ params }: Props) {
  const { id, attemptId } = use(params);
  const test = getTestById(id);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [reviewAdded, setReviewAdded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(`tb-attempt:${attemptId}`);
    if (raw) {
      try {
        setAttempt(JSON.parse(raw) as ExamAttempt);
      } catch {
        // ignore
      }
    }
  }, [attemptId]);

  if (!test || !attempt) {
    return (
      <Container>
        <p>没找到这次答题记录, 可能浏览器 sessionStorage 已清空</p>
        <Link
          href={`${TEST_BANK_BASE}/${id}`}
          className="mt-3 inline-block text-sm text-brand-700 hover:underline"
        >
          ← 返回 {test?.name ?? "题目页"}
        </Link>
      </Container>
    );
  }

  const allQuestions: ExamQuestion[] =
    attempt.module === "reading"
      ? flattenReadingQuestions(test.reading)
      : flattenListeningQuestions(test.listening);
  const wrongQuestions = allQuestions.filter(
    (q) => !isCorrect(q, attempt.answers[q.id] ?? "")
  );

  function handleAddToReview() {
    if (!test || !attempt) return;
    const now = Date.now();
    for (const q of wrongQuestions) {
      const item: ReviewItem = {
        id: `tb-${test.id}-${attempt.module}-${q.id}`,
        type: "examQuestion",
        refId: q.id,
        payload: {
          testId: test.id,
          testName: test.name,
          module: attempt.module,
          questionNumber: q.number,
          prompt: q.prompt,
          userAnswer: attempt.answers[q.id] ?? "",
          correctAnswer: Array.isArray(q.answer)
            ? q.answer.join(" / ")
            : q.answer
        },
        due: now + 24 * 3600 * 1000,
        ease: 2.5,
        interval: 1
      };
      storage.upsertReviewItem(item);
    }
    setReviewAdded(true);
  }

  const passages =
    attempt.module === "reading" ? test.reading : test.listening;

  return (
    <Container>
      <PageHeader
        title={`${test.name} · ${attempt.module === "reading" ? "阅读" : "听力"} 结果`}
        right={
          <Link
            href={`${TEST_BANK_BASE}/${test.id}`}
            className="text-sm muted hover:text-ink"
          >
            ← 返回
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs muted">答对</p>
          <p className="mt-1 text-2xl font-semibold">
            {attempt.correct} / {attempt.total}
          </p>
        </Card>
        <Card>
          <p className="text-xs muted">估算 Band</p>
          <p className="mt-1 text-2xl font-semibold text-brand-700">
            {attempt.bandScore.toFixed(1)}
          </p>
        </Card>
        <Card>
          <p className="text-xs muted">用时</p>
          <p className="mt-1 text-2xl font-semibold">
            {Math.round(attempt.durationMs / 60000)} 分
          </p>
        </Card>
        <Card>
          <p className="text-xs muted">错题</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">
            {wrongQuestions.length}
          </p>
        </Card>
      </div>

      {wrongQuestions.length > 0 ? (
        <Card className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              错题加入复习队列, 1 天后会在 /review 提醒你重做
            </p>
            <Button
              onClick={handleAddToReview}
              disabled={reviewAdded}
              variant="soft"
            >
              {reviewAdded ? "已加入" : "加入复习"}
            </Button>
          </div>
        </Card>
      ) : null}

      <h2 className="section-title mb-3">答案对照</h2>
      {passages.map((p, idx) => (
        <div key={p.id} className="mb-6">
          <h3 className="mb-2 text-sm font-semibold muted">
            {attempt.module === "reading"
              ? `Passage ${idx + 1}: ${p.title}`
              : `Section ${idx + 1}: ${p.title}`}
          </h3>
          {p.groups.map((g) => (
            <QuestionGroupBlock
              key={g.id}
              group={g}
              answers={attempt.answers}
              onChange={() => {
                // no-op, review only
              }}
              reviewMode
              isCorrect={isCorrect}
            />
          ))}
          {attempt.module === "listening" &&
          "transcript" in p &&
          (p as { transcript: string }).transcript ? (
            <details className="mt-2 rounded-md border border-black/10 p-3 text-sm">
              <summary className="cursor-pointer text-brand-700">
                展开 transcript
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed muted">
                {(p as { transcript: string }).transcript}
              </pre>
            </details>
          ) : null}
        </div>
      ))}
    </Container>
  );
}
