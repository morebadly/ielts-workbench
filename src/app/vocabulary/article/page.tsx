"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { speak } from "@/lib/tts";
import { getArticleForDay } from "@/data/mockArticles";
import { MOCK_WORDS } from "@/data/mockWords";
import { useDailyTask } from "@/hooks/useDailyTask";
import { gradeSentence } from "@/lib/grading";

export default function VocabularyArticlePage() {
  const { user, bump } = useDailyTask();
  const article = useMemo(
    () => getArticleForDay(user.activeBookId, user.currentDay),
    [user.activeBookId, user.currentDay]
  );

  const [explainSentence, setExplainSentence] = useState<string | null>(null);
  const [listenInput, setListenInput] = useState("");
  const [listenFeedback, setListenFeedback] = useState<string | null>(null);

  if (!article) {
    return (
      <Container>
        <PageHeader title="今日词汇文章" />
        <Card>
          <p>这一天的文章还没生成。</p>
        </Card>
      </Container>
    );
  }

  const wordMap = new Map(MOCK_WORDS.map((w) => [w.id, w]));
  const highlightedSet = new Set(
    article.highlightWordIds
      .map((id) => wordMap.get(id)?.word)
      .filter(Boolean)
      .map((w) => (w as string).toLowerCase())
  );

  const renderHighlighted = (paragraph: string) => {
    const tokens = paragraph.split(/(\s+|[.,;:?!"])/);
    return tokens.map((t, i) => {
      const stripped = t.toLowerCase();
      if (highlightedSet.has(stripped)) {
        return (
          <mark
            key={i}
            className="rounded bg-brand-100 px-0.5 text-brand-700"
            style={{ background: "transparent" }}
          >
            <span className="rounded bg-brand-100 px-0.5 text-brand-700">{t}</span>
          </mark>
        );
      }
      return <span key={i}>{t}</span>;
    });
  };

  const playAll = (rate = 1) =>
    speak(article.body.replace(/\n+/g, ". "), {
      voice: user.preferences.voice,
      rate
    });

  const finish = () => bump("vocabularyArticleDone");

  const checkListen = () => {
    const audioQ = article.questions.find((q) => q.type === "listenAndWrite");
    if (!audioQ?.audioText) return;
    const r = gradeSentence(listenInput, audioQ.audioText);
    setListenFeedback(
      r.correct ? "✓ 完全正确" : `✗ 参考:${audioQ.audioText}`
    );
  };

  return (
    <Container>
      <PageHeader
        title="今日词汇文章"
        subtitle={article.title}
        right={
          <Link href="/vocabulary">
            <Button variant="ghost">返回</Button>
          </Link>
        }
      />

      <Card padding="lg" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={() => playAll(1)}>
            ▶ 播放全文
          </Button>
          <Button variant="ghost" onClick={() => playAll(0.75)}>
            慢速
          </Button>
        </div>
        <div className="space-y-3 font-serif text-[15.5px] leading-relaxed">
          {article.body.split(/\n+/).map((p, i) => (
            <p key={i} className="group">
              <span>{renderHighlighted(p)}</span>
              <button
                className="ml-1 align-middle text-xs text-ink-muted opacity-0 transition group-hover:opacity-100"
                onClick={() => setExplainSentence(p)}
              >
                逐句解释
              </button>
            </p>
          ))}
        </div>
        {explainSentence ? (
          <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50 p-3 text-xs text-brand-700">
            <div className="font-medium">逐句解释占位</div>
            <p className="mt-1">{explainSentence}</p>
            <p className="mt-1 muted">
              后续接入 AI 后,这里会给出该句的语法、关键搭配和中文翻译。
            </p>
          </div>
        ) : null}
      </Card>

      <Card className="mt-4">
        <h3 className="section-title">练习</h3>
        <ol className="mt-3 space-y-4 text-sm">
          {article.questions.map((q, i) => (
            <li key={q.id} className="rounded-xl bg-bg-soft/60 p-3">
              <div className="font-medium">
                {i + 1}. {q.prompt}
              </div>
              {q.type === "meaningInContext" && q.targetWordId ? (
                <p className="mt-2 muted">
                  目标词:{wordMap.get(q.targetWordId)?.word} ·{" "}
                  {wordMap.get(q.targetWordId)?.chineseMeaning}
                </p>
              ) : null}
              {q.type === "useWordInIelts" && q.targetWordId ? (
                <textarea
                  className="textarea mt-2"
                  rows={2}
                  placeholder={`Try writing one IELTS-style sentence using "${wordMap.get(q.targetWordId)?.word}".`}
                />
              ) : null}
              {q.type === "listenAndWrite" && q.audioText ? (
                <div className="mt-2 space-y-2">
                  <Button
                    variant="soft"
                    onClick={() => speak(q.audioText!, { voice: user.preferences.voice })}
                  >
                    ▶ 播放
                  </Button>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={listenInput}
                    onChange={(e) => setListenInput(e.target.value)}
                    placeholder="默写听到的句子"
                  />
                  <div className="flex gap-2">
                    <Button onClick={checkListen}>检查</Button>
                  </div>
                  {listenFeedback ? (
                    <div className="text-xs text-ink-soft">{listenFeedback}</div>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex justify-end">
          <Button onClick={finish}>标记今日文章已读</Button>
        </div>
      </Card>
    </Container>
  );
}
