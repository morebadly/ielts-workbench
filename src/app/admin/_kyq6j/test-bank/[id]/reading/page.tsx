"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuestionGroupBlock } from "@/components/testBank/QuestionGroupBlock";
import { getTestById } from "@/data/testBank";
import {
  buildAttempt,
  flattenReadingQuestions,
  READING_DURATION_MS,
  TEST_BANK_BASE
} from "@/lib/testBank";
import { useCountdown } from "@/hooks/useTimer";
import { formatMs } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReadingExamPage({ params }: Props) {
  const { id } = use(params);
  const test = getTestById(id);
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activePassage, setActivePassage] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  const timer = useCountdown(READING_DURATION_MS);
  // 进页面就开始倒计时, 提交后停掉
  useEffect(() => {
    if (!submitted) timer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalQuestions = useMemo(
    () => (test ? flattenReadingQuestions(test.reading).length : 0),
    [test]
  );
  const answeredCount = Object.values(answers).filter(Boolean).length;

  // 倒计时归零自动提交
  useEffect(() => {
    if (timer.ms === 0 && !submitted && timer.running === false) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.ms]);

  if (!test) {
    return (
      <Container>
        <p>未找到该套题</p>
      </Container>
    );
  }

  function handleSubmit() {
    if (!test || submitted) return;
    setSubmitted(true);
    timer.pause();
    const attempt = buildAttempt({
      test,
      module: "reading",
      answers,
      startedAt: startedAtRef.current,
      durationMs: Date.now() - startedAtRef.current
    });
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        `tb-attempt:${attempt.id}`,
        JSON.stringify(attempt)
      );
    }
    router.push(`${TEST_BANK_BASE}/${test.id}/result/${attempt.id}`);
  }

  const passage = test.reading[activePassage];

  return (
    <Container>
      <PageHeader
        title={`${test.name} · 阅读`}
        subtitle={`Passage ${activePassage + 1} / ${test.reading.length}`}
        right={
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg tabular-nums">
              {formatMs(timer.ms)}
            </span>
            <Link
              href={`${TEST_BANK_BASE}/${test.id}`}
              className="text-sm muted hover:text-ink"
            >
              退出
            </Link>
          </div>
        }
      />

      {test.isMock ? (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          DEMO 占位中, 文章为自写
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {test.reading.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePassage(i)}
            className={`rounded-md px-3 py-1 text-sm ${
              activePassage === i
                ? "bg-brand-500 text-white"
                : "bg-bg-soft hover:bg-black/10"
            }`}
          >
            Passage {p.order}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <h3 className="section-title">{passage.title}</h3>
          {passage.subtitle ? (
            <p className="mt-1 text-sm muted">{passage.subtitle}</p>
          ) : null}
          <div className="mt-3 space-y-3 text-sm leading-relaxed whitespace-pre-line">
            {passage.body}
          </div>
        </Card>

        <div>
          {passage.groups.map((g) => (
            <QuestionGroupBlock
              key={g.id}
              group={g}
              answers={answers}
              onChange={(qId, v) =>
                setAnswers((prev) => ({ ...prev, [qId]: v }))
              }
            />
          ))}
        </div>
      </div>

      <div className="sticky bottom-2 mt-6 flex items-center justify-between rounded-lg bg-white p-3 shadow-md ring-1 ring-black/5">
        <span className="text-sm muted">
          已答 {answeredCount} / {totalQuestions}
        </span>
        <Button onClick={handleSubmit}>提交全部</Button>
      </div>
    </Container>
  );
}
