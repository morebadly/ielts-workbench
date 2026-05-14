"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  countParagraphs,
  countWords,
  formatMs,
  hasBlankLineBetweenParagraphs
} from "@/lib/utils";
import { MOCK_WRITING_PROMPTS } from "@/data/mockWriting";
import { useCountdown } from "@/hooks/useTimer";
import type { WritingPractice, WritingTaskType } from "@/types";
import { storage } from "@/lib/storage";

export default function WritingExamPage() {
  const [taskType, setTaskType] = useState<WritingTaskType>("task2");
  const promptList = useMemo(
    () => MOCK_WRITING_PROMPTS.filter((p) => p.taskType === taskType),
    [taskType]
  );
  const [promptId, setPromptId] = useState(promptList[0].id);
  const prompt = useMemo(
    () => promptList.find((p) => p.id === promptId) || promptList[0],
    [promptId, promptList]
  );

  useEffect(() => {
    setPromptId(promptList[0].id);
  }, [taskType]);

  const totalMs = prompt.recommendedMinutes * 60 * 1000;
  const timer = useCountdown(totalMs);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<WritingPractice | null>(null);
  const [practiceId] = useState(() => `wp-${Date.now()}`);

  useEffect(() => {
    timer.reset(totalMs);
    setText("");
    setSubmitted(null);
  }, [prompt.id]);

  const wc = countWords(text);
  const pc = countParagraphs(text);
  const hasBlank = hasBlankLineBetweenParagraphs(text);

  const submit = () => {
    const now = Date.now();
    const record: WritingPractice = {
      id: practiceId,
      promptId: prompt.id,
      taskType,
      content: text,
      wordCount: wc,
      paragraphCount: pc,
      hasBlankLineBetweenParagraphs: hasBlank,
      startedAt: now - (totalMs - timer.ms),
      submittedAt: now,
      durationMs: totalMs - timer.ms
    };
    storage.appendWritingPractice(record);
    setSubmitted(record);
    timer.pause();
  };

  return (
    <Container>
      <PageHeader
        title="写作机考模拟"
        subtitle="带倒计时、字数、段落检测,提交后给出结构反馈。"
        right={
          <Link href="/writing">
            <Button variant="ghost">返回</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="text-xs muted">Task 类型</div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Button
              variant={taskType === "task1" ? "primary" : "soft"}
              onClick={() => setTaskType("task1")}
            >
              Task 1
            </Button>
            <Button
              variant={taskType === "task2" ? "primary" : "soft"}
              onClick={() => setTaskType("task2")}
            >
              Task 2
            </Button>
          </div>

          <div className="mt-4 text-xs muted">题目</div>
          <select
            className="input mt-1"
            value={promptId}
            onChange={(e) => setPromptId(e.target.value)}
          >
            {promptList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <div className="mt-4 rounded-xl bg-bg-soft/60 p-3 text-sm leading-relaxed">
            {prompt.promptText}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-black/5 p-3">
              <div className="text-xs muted">倒计时</div>
              <div className="mt-1 font-mono text-2xl tabular-nums">
                {formatMs(timer.ms)}
              </div>
            </div>
            <div className="rounded-xl border border-black/5 p-3">
              <div className="text-xs muted">字数</div>
              <div
                className={
                  wc >= prompt.minWords
                    ? "mt-1 text-2xl font-semibold tabular-nums text-brand-600"
                    : "mt-1 text-2xl font-semibold tabular-nums"
                }
              >
                {wc}
                <span className="text-sm muted"> / {prompt.minWords}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {!timer.running ? (
              <Button onClick={timer.start}>开始 / 继续</Button>
            ) : (
              <Button variant="soft" onClick={timer.pause}>
                暂停
              </Button>
            )}
            <Button variant="ghost" onClick={() => timer.reset(totalMs)}>
              重置时间
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Stat label="段落数" value={pc} good={pc === prompt.recommendedParagraphs} />
            <Stat label="段间空行" value={hasBlank ? "是" : "否"} good={hasBlank} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <textarea
            className="textarea min-h-[26rem] font-serif text-[15px] leading-relaxed"
            placeholder={
              taskType === "task1"
                ? "Paragraph 1: 改写题目\n\nParagraph 2: Overview\n\nParagraph 3: Details 1\n\nParagraph 4: Details 2"
                : "Paragraph 1: Introduction(改写 + 立场)\n\nParagraph 2: Body 1\n\nParagraph 3: Body 2\n\nParagraph 4: Conclusion"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mt-3 flex justify-end gap-2">
            <Button variant="soft" onClick={() => setText("")}>
              清空
            </Button>
            <Button onClick={submit}>提交</Button>
          </div>

          {submitted ? (
            <FeedbackPlaceholder practice={submitted} />
          ) : null}
        </Card>
      </div>
    </Container>
  );
}

function Stat({
  label,
  value,
  good
}: {
  label: string;
  value: string | number;
  good: boolean;
}) {
  return (
    <div
      className={
        good
          ? "rounded-lg border border-brand-200 bg-brand-50 p-2"
          : "rounded-lg border border-black/5 bg-bg-soft/60 p-2"
      }
    >
      <div className="muted">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function FeedbackPlaceholder({ practice }: { practice: WritingPractice }) {
  const isTask1 = practice.taskType === "task1";
  const items = isTask1
    ? [
        "是否有 Overview",
        "是否抓住主要趋势",
        "数据描述是否准确",
        "比较句是否自然",
        "语法和词汇问题",
        "修改版"
      ]
    : [
        "立场是否清楚",
        "论证是否充分",
        "段落逻辑是否顺",
        "词汇是否重复",
        "语法错误",
        "修改版"
      ];
  return (
    <div className="mt-5 rounded-xl border border-dashed border-brand-200 bg-brand-50 p-4">
      <h4 className="font-semibold text-brand-700">AI 批改占位</h4>
      <p className="mt-1 text-xs muted">
        提交已保存。后续接入 AI 后,这里会针对下面这些维度给出反馈:
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-1 text-sm text-brand-700">
        {items.map((it) => (
          <li key={it} className="rounded-md bg-white/70 px-2 py-1">
            · {it}
          </li>
        ))}
      </ul>
      <div className="mt-3 text-xs muted">
        本次:{practice.wordCount} 词 · {practice.paragraphCount} 段 · 用时{" "}
        {formatMs(practice.durationMs)}
      </div>
    </div>
  );
}
