"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  countParagraphs,
  countWords,
  hasBlankLineBetweenParagraphs
} from "@/lib/utils";
import { MOCK_WRITING_PROMPTS } from "@/data/mockWriting";

export default function WritingParagraphPage() {
  const [promptId, setPromptId] = useState(MOCK_WRITING_PROMPTS[1].id);
  const prompt = useMemo(
    () => MOCK_WRITING_PROMPTS.find((p) => p.id === promptId)!,
    [promptId]
  );
  const [text, setText] = useState("");

  const wc = countWords(text);
  const pc = countParagraphs(text);

  return (
    <Container>
      <PageHeader
        title="段落训练"
        subtitle="围绕一个题目写一段(80–120 词),不计时。"
        right={
          <Link href="/writing">
            <Button variant="ghost">返回</Button>
          </Link>
        }
      />
      <Card className="mb-3">
        <div className="text-xs muted">题目</div>
        <select
          className="input mt-1"
          value={promptId}
          onChange={(e) => setPromptId(e.target.value)}
        >
          {MOCK_WRITING_PROMPTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm leading-relaxed">{prompt.promptText}</p>
      </Card>

      <Card>
        <textarea
          className="textarea min-h-[16rem]"
          placeholder="只写一段,聚焦一个观点。"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-soft">
          <span className="pill">字数 {wc}</span>
          <span className="pill">段落 {pc}</span>
          {hasBlankLineBetweenParagraphs(text) ? (
            <span className="pill">段间已空行</span>
          ) : null}
        </div>
      </Card>
    </Container>
  );
}
