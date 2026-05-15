"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NewsVocabularyList } from "@/components/news/NewsVocabularyList";
import { NewsWritingPrompt } from "@/components/news/NewsWritingPrompt";
import { speak, stopSpeaking } from "@/lib/tts";
import { TOPIC_LABEL } from "@/data/news/loader";
import type { DailyNewsItem } from "@/types";

const COPYRIGHT_NOTICE =
  "学习摘要由 AI 根据新闻标题和摘要生成,请点击原文查看完整报道。";

function formatPub(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN");
  } catch {
    return iso;
  }
}

export function NewsLearningPanel({
  item,
  voice = "us"
}: {
  item: DailyNewsItem;
  voice?: "uk" | "us";
}) {
  const [playing, setPlaying] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const playListening = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speak(item.listeningText, {
      voice,
      onEnd: () => setPlaying(false)
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill bg-brand-100 text-brand-700">
            {TOPIC_LABEL[item.topic] || item.topic}
          </span>
          <span className="text-xs muted">{item.source}</span>
          <span className="text-xs muted">·</span>
          <span className="text-xs muted">{formatPub(item.publishedAt)}</span>
          {item.aiSource ? (
            <span
              className={
                item.aiSource === "minimax"
                  ? "pill bg-brand-100 text-brand-700"
                  : "pill bg-bg-soft text-ink-soft"
              }
            >
              {item.aiSource === "minimax" ? "MiniMax" : "Mock"}
            </span>
          ) : null}
        </div>
        <h2 className="mt-2 text-xl font-semibold leading-snug">{item.title}</h2>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-brand-700 hover:underline"
        >
          阅读原文 ↗
        </a>
        <div className="mt-3 rounded-lg bg-accent-warm/10 px-3 py-2 text-xs text-accent-warm">
          {COPYRIGHT_NOTICE}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="section-title">AI 学习摘要</h3>
          <Button variant="ghost" onClick={() => setShowOriginal((v) => !v)}>
            {showOriginal ? "隐藏原始摘要" : "对照原始摘要"}
          </Button>
        </div>
        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">
          {item.learningSummary}
        </p>
        {showOriginal ? (
          <div className="mt-3 rounded-lg border border-dashed border-black/10 bg-bg-soft/40 p-3 text-xs text-ink-soft">
            <div className="mb-1 font-medium">RSS 原始摘要(短引用,仅作对照)</div>
            <p className="whitespace-pre-line">{item.originalSummary}</p>
          </div>
        ) : null}
      </Card>

      <NewsVocabularyList
        newsId={item.id}
        newsTitle={item.title}
        vocabulary={item.vocabulary}
      />

      <Card>
        <h3 className="section-title">阅读理解</h3>
        <ol className="mt-2 list-decimal space-y-3 pl-5">
          {item.readingQuestions.map((q, i) => (
            <li key={i}>
              <p className="font-medium">{q.question}</p>
              <details className="mt-1 text-sm text-ink-soft">
                <summary className="cursor-pointer text-brand-700">
                  显示答案
                </summary>
                <p className="mt-1">{q.answer}</p>
              </details>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="section-title">听力 · TTS</h3>
          <Button onClick={playListening} variant={playing ? "ghost" : "primary"}>
            {playing ? "停止" : "▶ 播放"}
          </Button>
        </div>
        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">
          {item.listeningText}
        </p>
      </Card>

      <NewsWritingPrompt prompt={item.writingPrompt} />
    </div>
  );
}
