"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AISourceBadge } from "@/components/ui/AISourceBadge";
import { AIResultNotice } from "@/components/ai/AIResultNotice";
import { MOCK_SENTENCE_DRILLS } from "@/data/mockWriting";
import { useDailyTask } from "@/hooks/useDailyTask";
import { callAI, type AISource, type SentenceFeedbackData } from "@/lib/ai/client";

export default function WritingSentencePage() {
  const { bump } = useDailyTask();
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [aiData, setAiData] = useState<SentenceFeedbackData | null>(null);
  const [aiSource, setAiSource] = useState<AISource | "loading" | null>(null);
  const [aiReason, setAiReason] = useState<string | undefined>();
  const [aiErrorCode, setAiErrorCode] = useState<string | undefined>();

  const item = MOCK_SENTENCE_DRILLS[idx];

  const submit = () => {
    setRevealed(true);
    bump("writingSentencesDone");
  };

  const askAI = async () => {
    if (!input.trim()) return;
    setAiSource("loading");
    const fallback = (): SentenceFeedbackData => ({
      grammarIssues: [],
      moreNatural: item.suggested,
      ieltsUsage: item.suggested,
      comments: "Mock 反馈:配置 MINIMAX_API_KEY 后会得到 AI 点评。"
    });
    const r = await callAI(
      "sentenceFeedback",
      { word: "(sentence drill)", userSentence: input.trim() },
      fallback
    );
    setAiData(r.data);
    setAiSource(r.source);
    setAiReason(r.reason);
    setAiErrorCode(r.errorCode);
  };

  const next = () => {
    setRevealed(false);
    setInput("");
    setAiData(null);
    setAiSource(null);
    setIdx((i) => (i + 1) % MOCK_SENTENCE_DRILLS.length);
  };

  return (
    <Container>
      <PageHeader
        title="句子训练"
        subtitle="先按中文意思自己写一遍,再对比参考,或让 AI 给你点评。"
        right={
          <Link href="/writing">
            <Button variant="ghost">返回</Button>
          </Link>
        }
      />

      <Card padding="lg" className="space-y-4">
        <CardHeader title="中文" subtitle={`第 ${idx + 1} / ${MOCK_SENTENCE_DRILLS.length} 句`} />
        <p className="rounded-xl bg-bg-soft/60 p-3 text-sm">{item.chinese}</p>

        <textarea
          className="textarea"
          rows={3}
          value={input}
          placeholder="用英文写下你的版本"
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={next}>
              跳过
            </Button>
            <Button variant="soft" onClick={askAI}>
              让 AI 点评
            </Button>
            {aiSource ? <AISourceBadge source={aiSource} reason={aiReason} /> : null}
          </div>
          {!revealed ? (
            <Button onClick={submit}>对比参考</Button>
          ) : (
            <Button onClick={next}>下一句</Button>
          )}
        </div>

        {revealed ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
            <div className="text-xs muted">参考表达</div>
            <p className="mt-1 font-serif text-[15px] leading-relaxed">{item.suggested}</p>
          </div>
        ) : null}

        {aiData ? (
          <div className="space-y-2">
            {aiSource === "mock" ? (
              <AIResultNotice
                source="mock"
                reason={aiReason}
                errorCode={aiErrorCode}
              />
            ) : null}
            <div className="space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
            {aiData.grammarIssues.length ? (
              <div>
                <div className="text-xs muted">语法问题</div>
                <ul className="mt-1 list-disc pl-5 text-ink-soft">
                  {aiData.grammarIssues.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <div className="text-xs muted">更自然</div>
              <p className="font-serif">{aiData.moreNatural}</p>
            </div>
            <div>
              <div className="text-xs muted">IELTS 可用表达</div>
              <p className="font-serif">{aiData.ieltsUsage}</p>
            </div>
            {aiData.comments ? (
              <div className="text-xs text-brand-700">{aiData.comments}</div>
            ) : null}
            </div>
          </div>
        ) : null}
      </Card>
    </Container>
  );
}
