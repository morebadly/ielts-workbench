"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AISourceBadge } from "@/components/ui/AISourceBadge";
import { AIResultNotice } from "@/components/ai/AIResultNotice";
import { speak } from "@/lib/tts";
import { getPronunciationGuide } from "@/lib/pronunciation";
import {
  callAI,
  type AISource,
  type PronunciationData,
  type SentenceFeedbackData
} from "@/lib/ai/client";
import type { Word, WordProgress } from "@/types";
import { WORD_STATUS_LABEL } from "@/types";
import { applyFeedback, type Feedback } from "@/lib/srs";
import { SrsStatusBadge } from "@/components/vocabulary/SrsStatusBadge";

interface Props {
  word: Word;
  progress: WordProgress;
  voice: "uk" | "us";
  onFeedback: (next: WordProgress) => void;
  onSentenceSubmit?: (sentence: string) => void;
}

export function WordCard({ word, progress, voice, onFeedback, onSentenceSubmit }: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [guideData, setGuideData] = useState<PronunciationData | null>(null);
  const [guideSource, setGuideSource] = useState<AISource | "loading" | null>(null);
  const [guideReason, setGuideReason] = useState<string | undefined>();
  const [guideErrorCode, setGuideErrorCode] = useState<string | undefined>();

  const [sentence, setSentence] = useState("");
  const [sentenceData, setSentenceData] = useState<SentenceFeedbackData | null>(null);
  const [sentenceSource, setSentenceSource] = useState<AISource | "loading" | null>(null);
  const [sentenceReason, setSentenceReason] = useState<string | undefined>();
  const [sentenceErrorCode, setSentenceErrorCode] = useState<string | undefined>();

  useEffect(() => {
    setShowGuide(false);
    setGuideData(null);
    setGuideSource(null);
    setSentence("");
    setSentenceData(null);
    setSentenceSource(null);
  }, [word.id]);

  const handleFb = (fb: Feedback) => {
    onFeedback(applyFeedback(progress, fb));
  };

  const loadGuide = async () => {
    setShowGuide(true);
    if (guideData) return;
    setGuideSource("loading");
    const fallback = (): PronunciationData => {
      const g = getPronunciationGuide(word);
      return {
        syllables: g.syllables,
        stressIndex: g.stressIndex,
        chineseHint: g.chineseHint,
        commonMistakes: g.commonMistakes
      };
    };
    const r = await callAI(
      "pronunciation",
      {
        word: word.word,
        phonetic: word.phonetic,
        exampleSentence: word.exampleSentence
      },
      fallback
    );
    setGuideData(r.data);
    setGuideSource(r.source);
    setGuideReason(r.reason);
    setGuideErrorCode(r.errorCode);
  };

  const handleSentence = async () => {
    if (!sentence.trim()) return;
    onSentenceSubmit?.(sentence.trim());
    setSentenceSource("loading");
    const fallback = (): SentenceFeedbackData => ({
      grammarIssues: [],
      moreNatural: sentence.trim(),
      ieltsUsage: `${word.word} can be naturally used in IELTS writing about ${word.wordList.toLowerCase()}.`,
      comments: "AI 暂未启用,这是一条 mock 反馈。配置 MINIMAX_API_KEY 后可看到真实点评。"
    });
    const r = await callAI(
      "sentenceFeedback",
      { word: word.word, userSentence: sentence.trim() },
      fallback
    );
    setSentenceData(r.data);
    setSentenceSource(r.source);
    setSentenceReason(r.reason);
    setSentenceErrorCode(r.errorCode);
  };

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end gap-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{word.word}</h2>
            <span className="pb-1 text-sm text-ink-soft">{word.phonetic}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs muted">
            <span className="pill">{word.wordList}</span>
            <span className="pill">{WORD_STATUS_LABEL[progress.status]}</span>
            <span className="pill">复习 {progress.reviewCount} 次</span>
            <SrsStatusBadge progress={progress} variant="compact" />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="soft" onClick={() => speak(word.word, { voice })} aria-label="播放单词">
            ▶ 单词
          </Button>
          <Button
            variant="ghost"
            onClick={() => speak(word.word, { voice, rate: 0.7 })}
            aria-label="慢速"
          >
            慢速
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs muted">中文意思</div>
          <div className="mt-1 text-base">{word.chineseMeaning}</div>
        </div>
        <div>
          <div className="text-xs muted">English Definition</div>
          <div className="mt-1 text-base">{word.englishDefinition}</div>
        </div>
      </div>

      <div className="rounded-xl bg-bg-soft/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="min-w-0 flex-1 font-serif text-[15px] leading-relaxed">&ldquo;{word.exampleSentence}&rdquo;</p>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="soft"
              onClick={() => speak(word.exampleSentence, { voice })}
            >
              ▶ 例句
            </Button>
            <Button
              variant="ghost"
              onClick={() => speak(word.exampleSentence, { voice, rate: 0.7 })}
            >
              慢速
            </Button>
          </div>
        </div>
        {word.exampleTranslation ? (
          <p className="mt-2 text-sm muted">{word.exampleTranslation}</p>
        ) : null}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={showGuide ? () => setShowGuide(false) : loadGuide}>
            {showGuide ? "收起怎么读" : "告诉我怎么读"}
          </Button>
          {guideSource ? <AISourceBadge source={guideSource} reason={guideReason} /> : null}
        </div>
        {showGuide && guideData ? (
          <div className="mt-3 space-y-3">
            {guideSource === "mock" ? (
              <AIResultNotice
                source="mock"
                reason={guideReason}
                errorCode={guideErrorCode}
              />
            ) : null}
            <div className="rounded-xl border border-black/5 bg-bg-card p-4 text-sm leading-relaxed">
              <div className="flex flex-wrap items-center gap-1">
                {guideData.syllables.map((s, i) => (
                  <span
                    key={i}
                    className={
                      i === guideData.stressIndex
                        ? "rounded-md bg-brand-100 px-2 py-1 font-semibold text-brand-700"
                        : "rounded-md bg-bg-soft px-2 py-1 text-ink-soft"
                    }
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-ink-soft">
                <span className="text-ink">中文读法提示:</span> {guideData.chineseHint}
              </div>
              <ul className="mt-2 list-disc pl-5 text-ink-soft">
                {guideData.commonMistakes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <SrsStatusBadge progress={progress} variant="detailed" />
        <div className="grid grid-cols-3 gap-2">
          <Button variant="soft" onClick={() => handleFb("forget")}>
            不会
          </Button>
          <Button variant="soft" onClick={() => handleFb("fuzzy")}>
            模糊
          </Button>
          <Button variant="primary" onClick={() => handleFb("remember")}>
            我会了
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2 text-xs muted">
          用这个词造一句(雅思相关最佳)
          {sentenceSource ? (
            <AISourceBadge source={sentenceSource} reason={sentenceReason} />
          ) : null}
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder={`例如:Online learning has facilitated...`}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          />
          <Button variant="soft" onClick={handleSentence}>
            提交
          </Button>
        </div>
        {sentenceData ? (
          <div className="mt-2 space-y-2">
            {sentenceSource === "mock" ? (
              <AIResultNotice
                source="mock"
                reason={sentenceReason}
                errorCode={sentenceErrorCode}
              />
            ) : null}
            <div className="space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
              {sentenceData.grammarIssues.length ? (
                <div>
                  <div className="text-xs muted">语法问题</div>
                  <ul className="mt-1 list-disc pl-5 text-ink-soft">
                    {sentenceData.grammarIssues.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <div className="text-xs muted">更自然</div>
                <p className="font-serif">{sentenceData.moreNatural}</p>
              </div>
              <div>
                <div className="text-xs muted">IELTS 可用表达</div>
                <p className="font-serif">{sentenceData.ieltsUsage}</p>
              </div>
              {sentenceData.comments ? (
                <div className="text-xs text-brand-700">{sentenceData.comments}</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
