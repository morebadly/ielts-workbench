"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { speak } from "@/lib/tts";
import { getPronunciationGuide } from "@/lib/pronunciation";
import type { Word, WordProgress } from "@/types";
import { WORD_STATUS_LABEL } from "@/types";
import { applyFeedback, type Feedback } from "@/lib/srs";

interface Props {
  word: Word;
  progress: WordProgress;
  voice: "uk" | "us";
  onFeedback: (next: WordProgress) => void;
  onSentenceSubmit?: (sentence: string) => void;
}

export function WordCard({ word, progress, voice, onFeedback, onSentenceSubmit }: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [sentence, setSentence] = useState("");
  const [aiPlaceholder, setAiPlaceholder] = useState<string | null>(null);

  useEffect(() => {
    setShowGuide(false);
    setSentence("");
    setAiPlaceholder(null);
  }, [word.id]);

  const guide = getPronunciationGuide(word);

  const handleFb = (fb: Feedback) => {
    onFeedback(applyFeedback(progress, fb));
  };

  const handleSentence = () => {
    if (!sentence.trim()) return;
    onSentenceSubmit?.(sentence.trim());
    setAiPlaceholder("AI 修改占位:已记录你的造句,后续接入 AI 后会在此显示修改建议。");
  };

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">{word.word}</h2>
            <span className="pb-1 text-sm text-ink-soft">{word.phonetic}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs muted">
            <span className="pill">{word.wordList}</span>
            <span className="pill">{WORD_STATUS_LABEL[progress.status]}</span>
            <span className="pill">复习 {progress.reviewCount} 次</span>
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
        <div className="flex items-start justify-between gap-3">
          <p className="font-serif text-[15px] leading-relaxed">
            “{word.exampleSentence}”
          </p>
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
        <Button variant="ghost" onClick={() => setShowGuide((v) => !v)}>
          {showGuide ? "收起怎么读" : "告诉我怎么读"}
        </Button>
        {showGuide ? (
          <div className="mt-3 rounded-xl border border-black/5 bg-bg-card p-4 text-sm leading-relaxed">
            <div className="flex flex-wrap items-center gap-1">
              {guide.syllables.map((s, i) => (
                <span
                  key={i}
                  className={
                    i === guide.stressIndex
                      ? "rounded-md bg-brand-100 px-2 py-1 font-semibold text-brand-700"
                      : "rounded-md bg-bg-soft px-2 py-1 text-ink-soft"
                  }
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-3 text-ink-soft">
              <span className="text-ink">中文读法提示:</span> {guide.chineseHint}
            </div>
            <ul className="mt-2 list-disc pl-5 text-ink-soft">
              {guide.commonMistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

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

      <div>
        <div className="mb-1 text-xs muted">用这个词造一句(雅思相关最佳)</div>
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
        {aiPlaceholder ? (
          <div className="mt-2 rounded-xl border border-dashed border-brand-200 bg-brand-50 p-3 text-xs text-brand-700">
            {aiPlaceholder}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
