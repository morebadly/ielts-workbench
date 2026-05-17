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
  flattenListeningQuestions,
  LISTENING_DURATION_MS,
  TEST_BANK_BASE
} from "@/lib/testBank";
import { useCountdown } from "@/hooks/useTimer";
import { formatMs } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListeningExamPage({ params }: Props) {
  const { id } = use(params);
  const test = getTestById(id);
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  const timer = useCountdown(LISTENING_DURATION_MS);
  useEffect(() => {
    if (!submitted) timer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalQuestions = useMemo(
    () => (test ? flattenListeningQuestions(test.listening).length : 0),
    [test]
  );
  const answeredCount = Object.values(answers).filter(Boolean).length;

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
      module: "listening",
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

  const section = test.listening[activeSection];
  const audioSrc = `/audio/${section.audioPath}`;

  return (
    <Container>
      <PageHeader
        title={`${test.name} · 听力`}
        subtitle={`Section ${section.order} / ${test.listening.length}`}
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
          DEMO 占位中, mp3 文件还没上传, 播放器会显示加载失败 (符合预期)
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {test.listening.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(i)}
            className={`rounded-md px-3 py-1 text-sm ${
              activeSection === i
                ? "bg-brand-500 text-white"
                : "bg-bg-soft hover:bg-black/10"
            }`}
          >
            Section {s.order}
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <h3 className="section-title">{section.title}</h3>
        <audio
          key={section.id}
          controls
          src={audioSrc}
          className="mt-2 w-full"
          onError={() =>
            setAudioError(`音频未找到: ${audioSrc} (DEMO 占位中正常)`)
          }
          onLoadedMetadata={() => setAudioError(null)}
        />
        {audioError ? (
          <p className="mt-2 text-xs text-rose-700">{audioError}</p>
        ) : null}
      </Card>

      <div>
        {section.groups.map((g) => (
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

      <div className="sticky bottom-2 mt-6 flex items-center justify-between rounded-lg bg-white p-3 shadow-md ring-1 ring-black/5">
        <span className="text-sm muted">
          已答 {answeredCount} / {totalQuestions}
        </span>
        <Button onClick={handleSubmit}>提交全部</Button>
      </div>
    </Container>
  );
}
