"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AISourceBadge } from "@/components/ui/AISourceBadge";
import { speak } from "@/lib/tts";
import { getArticleForDay } from "@/data/mockArticles";
import { getWordsByDay, getEnabledBookIds, getWordsFromBooks } from "@/data/mockWords";
import { useDailyTask } from "@/hooks/useDailyTask";
import { gradeSentence } from "@/lib/grading";
import { callAI, type AISource, type VocabArticleData } from "@/lib/ai/client";
import { AIResultNotice } from "@/components/ai/AIResultNotice";

export default function VocabularyArticlePage() {
  const { user, bump } = useDailyTask();
  const baseArticle = useMemo(
    () => getArticleForDay(user.activeBookId, user.currentDay),
    [user.activeBookId, user.currentDay]
  );

  const dayWords = useMemo(
    () => getWordsByDay(user.activeBookId, user.currentDay),
    [user.activeBookId, user.currentDay]
  );

  const [aiArticle, setAiArticle] = useState<VocabArticleData | null>(null);
  const [aiSource, setAiSource] = useState<AISource | "loading" | null>(null);
  const [aiReason, setAiReason] = useState<string | undefined>();
  const [aiErrorCode, setAiErrorCode] = useState<string | undefined>();

  const [explainSentence, setExplainSentence] = useState<string | null>(null);
  const [listenInput, setListenInput] = useState("");
  const [listenFeedback, setListenFeedback] = useState<string | null>(null);

  useEffect(() => {
    setAiArticle(null);
    setAiSource(null);
    setExplainSentence(null);
    setListenInput("");
    setListenFeedback(null);
  }, [user.currentDay, user.activeBookId]);

  const article = aiArticle
    ? {
        title: aiArticle.title,
        body: aiArticle.body,
        highlightWordIds: dayWords.map((w) => w.id),
        questions: baseArticle?.questions || []
      }
    : baseArticle;

  const wordMap = useMemo(() => {
    const enabled = getEnabledBookIds(user);
    return new Map(getWordsFromBooks(enabled).map((w) => [w.id, w]));
  }, [user]);

  const regenerate = async () => {
    setAiSource("loading");
    const fallback = (): VocabArticleData => ({
      title: baseArticle?.title || "Today's Reading",
      topic: "education",
      body: baseArticle?.body || ""
    });
    const r = await callAI(
      "vocabArticle",
      {
        words: dayWords.map((w) => ({
          word: w.word,
          chineseMeaning: w.chineseMeaning
        }))
      },
      fallback
    );
    setAiArticle(r.data);
    setAiSource(r.source);
    setAiReason(r.reason);
    setAiErrorCode(r.errorCode);
  };

  if (!article) {
    return (
      <Container>
        <PageHeader title="今日词汇文章" subtitle={`Day ${user.currentDay} · ${dayWords.length} 个词`} />
        <Card padding="lg" className="space-y-3 text-center">
          <p className="muted">
            这一天还没生成文章。点下面让 AI 用今日 {dayWords.length} 个新词写一篇短文,在语境里自然复现。
          </p>
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={regenerate}
              disabled={!dayWords.length || aiSource === "loading"}
            >
              {aiSource === "loading" ? "正在生成..." : "用 AI 生成今日文章"}
            </Button>
          </div>
          {aiSource === "mock" ? (
            <AIResultNotice
              source="mock"
              reason={aiReason}
              errorCode={aiErrorCode}
            />
          ) : null}
        </Card>
      </Container>
    );
  }

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
          <span key={i} className="rounded bg-brand-100 px-0.5 text-brand-700">
            {t}
          </span>
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
    setListenFeedback(r.correct ? "✓ 完全正确" : `✗ 参考:${audioQ.audioText}`);
  };

  return (
    <Container>
      <PageHeader
        title="今日词汇文章"
        subtitle={article.title}
        right={
          <div className="flex items-center gap-2">
            {aiSource ? <AISourceBadge source={aiSource} reason={aiReason} /> : null}
            <Button variant="soft" onClick={regenerate}>
              {aiArticle ? "再生成一篇" : "用 AI 生成"}
            </Button>
            <Link href="/vocabulary">
              <Button variant="ghost">返回</Button>
            </Link>
          </div>
        }
      />

      <Card padding="lg" className="space-y-3">
        {aiSource === "mock" && aiArticle ? (
          <AIResultNotice
            source="mock"
            reason={aiReason}
            errorCode={aiErrorCode}
          />
        ) : null}
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
              后续可调用 AI Provider 的 sentenceFeedback 给出语法、搭配和翻译。
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
