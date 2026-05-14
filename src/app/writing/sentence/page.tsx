"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MOCK_SENTENCE_DRILLS } from "@/data/mockWriting";
import { useDailyTask } from "@/hooks/useDailyTask";

export default function WritingSentencePage() {
  const { bump } = useDailyTask();
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);

  const item = MOCK_SENTENCE_DRILLS[idx];

  const submit = () => {
    setRevealed(true);
    bump("writingSentencesDone");
  };

  const next = () => {
    setRevealed(false);
    setInput("");
    setIdx((i) => (i + 1) % MOCK_SENTENCE_DRILLS.length);
  };

  return (
    <Container>
      <PageHeader
        title="句子训练"
        subtitle="先按中文意思自己写一遍,再对比参考。"
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

        {revealed ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
            <div className="text-xs muted">参考表达</div>
            <p className="mt-1 font-serif text-[15px] leading-relaxed">{item.suggested}</p>
            <div className="mt-2 text-xs muted">
              对比一下结构、动词搭配和连接词。AI 修改占位:后续接入 AI 后会针对你的版本给出修改建议。
            </div>
          </div>
        ) : null}

        <div className="flex justify-between">
          <Button variant="ghost" onClick={next}>
            跳过
          </Button>
          {!revealed ? (
            <Button onClick={submit}>对比参考</Button>
          ) : (
            <Button onClick={next}>下一句</Button>
          )}
        </div>
      </Card>
    </Container>
  );
}
