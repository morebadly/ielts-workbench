"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AISourceBadge } from "@/components/ui/AISourceBadge";
import { AIResultNotice } from "@/components/ai/AIResultNotice";
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
import {
  callAI,
  type AISource,
  type WritingTask1Data,
  type WritingTask2Data
} from "@/lib/ai/client";

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
            <AIFeedbackBlock practice={submitted} promptText={prompt.promptText} />
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

function AIFeedbackBlock({
  practice,
  promptText
}: {
  practice: WritingPractice;
  promptText: string;
}) {
  const isTask1 = practice.taskType === "task1";
  const [source, setSource] = useState<AISource | "loading" | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [task1, setTask1] = useState<WritingTask1Data | null>(null);
  const [task2, setTask2] = useState<WritingTask2Data | null>(null);

  useEffect(() => {
    setSource(null);
    setTask1(null);
    setTask2(null);
  }, [practice.id]);

  const grade = async () => {
    setSource("loading");
    if (isTask1) {
      const fallback = (): WritingTask1Data => ({
        hasOverview: practice.paragraphCount >= 2,
        capturesMainTrend: practice.wordCount >= 150,
        dataAccuracy: 3,
        comparisonNatural: 3,
        grammarIssues: [],
        vocabIssues: [],
        comments: "Mock 反馈:配置 MINIMAX_API_KEY 后会得到完整的 Task 1 评估。",
        revisedVersion: practice.content
      });
      const r = await callAI(
        "writingTask1",
        { promptText, essay: practice.content },
        fallback
      );
      setTask1(r.data);
      setSource(r.source);
      setReason(r.reason);
      setErrorCode(r.errorCode);
    } else {
      const fallback = (): WritingTask2Data => ({
        positionClear: practice.paragraphCount >= 4,
        argumentStrength: 3,
        paragraphLogic: 3,
        vocabRepetition: 3,
        grammarIssues: [],
        vocabIssues: [],
        comments: "Mock 反馈:配置 MINIMAX_API_KEY 后会得到完整的 Task 2 评估。",
        revisedVersion: practice.content
      });
      const r = await callAI(
        "writingTask2",
        { promptText, essay: practice.content },
        fallback
      );
      setTask2(r.data);
      setSource(r.source);
      setReason(r.reason);
      setErrorCode(r.errorCode);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-brand-700">AI 批改</h4>
        <div className="flex items-center gap-2">
          {source ? <AISourceBadge source={source} reason={reason} /> : null}
          <Button variant="soft" onClick={grade}>
            {source ? "再批一次" : "让 AI 批改"}
          </Button>
        </div>
      </div>
      <div className="mt-2 text-xs muted">
        本次:{practice.wordCount} 词 · {practice.paragraphCount} 段 · 用时{" "}
        {formatMs(practice.durationMs)}
      </div>

      {source === "mock" ? (
        <div className="mt-3">
          <AIResultNotice source="mock" reason={reason} errorCode={errorCode} />
        </div>
      ) : null}

      {isTask1 && task1 ? <Task1View data={task1} /> : null}
      {!isTask1 && task2 ? <Task2View data={task2} /> : null}
    </div>
  );
}

function Pill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "pill bg-brand-100 text-brand-700"
          : "pill bg-accent-rose/10 text-accent-rose"
      }
    >
      {label} {ok ? "✓" : "✗"}
    </span>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <span className="pill bg-bg-soft">
      {label} {value}/5
    </span>
  );
}

function Task1View({ data }: { data: WritingTask1Data }) {
  return (
    <div className="mt-3 space-y-3 text-sm">
      <div className="flex flex-wrap gap-1.5">
        <Pill label="Overview" ok={data.hasOverview} />
        <Pill label="抓住主要趋势" ok={data.capturesMainTrend} />
        <Score label="数据准确" value={data.dataAccuracy} />
        <Score label="比较自然" value={data.comparisonNatural} />
      </div>
      <IssuesList title="语法问题" items={data.grammarIssues} />
      <IssuesList title="词汇问题" items={data.vocabIssues} />
      <Comments text={data.comments} />
      <Revised text={data.revisedVersion} />
    </div>
  );
}

function Task2View({ data }: { data: WritingTask2Data }) {
  return (
    <div className="mt-3 space-y-3 text-sm">
      <div className="flex flex-wrap gap-1.5">
        <Pill label="立场清楚" ok={data.positionClear} />
        <Score label="论证强度" value={data.argumentStrength} />
        <Score label="段落逻辑" value={data.paragraphLogic} />
        <Score label="词汇重复(越高越好)" value={data.vocabRepetition} />
      </div>
      <IssuesList title="语法问题" items={data.grammarIssues} />
      <IssuesList title="词汇问题" items={data.vocabIssues} />
      <Comments text={data.comments} />
      <Revised text={data.revisedVersion} />
    </div>
  );
}

function IssuesList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-xs muted">{title}</div>
      <ul className="mt-1 list-disc pl-5 text-ink-soft">
        {items.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}

function Comments({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-lg bg-white/70 p-3">
      <div className="text-xs muted">总评</div>
      <p className="mt-1">{text}</p>
    </div>
  );
}

function Revised({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-lg bg-white/70 p-3">
      <div className="text-xs muted">改写版</div>
      <pre className="mt-1 whitespace-pre-wrap font-serif text-[14px] leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
