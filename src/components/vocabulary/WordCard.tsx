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
  type SentenceFeedbackData,
  type GenerateExampleData
} from "@/lib/ai/client";
import type { Word, WordProgress } from "@/types";
import { applyFeedback, type Feedback } from "@/lib/srs";
import { SrsStatusBadge } from "@/components/vocabulary/SrsStatusBadge";
import { ChineseMeaningParts } from "@/components/vocabulary/ChineseMeaningParts";
import { storage } from "@/lib/storage";

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

  // v1.10.5: 移动端默认折叠造句区, 减少滚动距离, 让"我会了"不用滑半屏才点到
  const [showSentenceBox, setShowSentenceBox] = useState(false);

  const [sentence, setSentence] = useState("");
  const [sentenceData, setSentenceData] = useState<SentenceFeedbackData | null>(null);
  const [sentenceSource, setSentenceSource] = useState<AISource | "loading" | null>(null);
  const [sentenceReason, setSentenceReason] = useState<string | undefined>();
  const [sentenceErrorCode, setSentenceErrorCode] = useState<string | undefined>();

  // v1.9: AI 按需生成的例句 (扫描书没有例句时使用)
  const [genExample, setGenExample] = useState<GenerateExampleData | null>(null);
  const [genSource, setGenSource] = useState<AISource | "loading" | null>(null);
  const [genReason, setGenReason] = useState<string | undefined>();

  useEffect(() => {
    setShowGuide(false);
    setGuideData(null);
    setGuideSource(null);
    setSentence("");
    setSentenceData(null);
    setSentenceSource(null);
    setShowSentenceBox(false);
    // 切词时优先从缓存读已生成的例句
    const cached = storage.getWordExamples()[word.id];
    if (cached) {
      setGenExample(cached);
      setGenSource("minimax");
    } else {
      setGenExample(null);
      setGenSource(null);
    }
    setGenReason(undefined);
  }, [word.id]);

  const handleGenerateExample = async () => {
    if (genSource === "loading") return;
    setGenSource("loading");
    const fallback = (): GenerateExampleData => ({
      exampleSentence: `${word.word} is commonly used in academic English.`,
      exampleTranslation: `${word.chineseMeaning.split(/[;,。;,]/)[0] || word.word} 在学术英语中很常用。`,
      memoryTip: `${word.word}: 记住核心释义"${word.chineseMeaning.split(/[;,。;,]/)[0] || ""}"。`
    });
    const r = await callAI(
      "generateExample",
      {
        word: word.word,
        chineseMeaning: word.chineseMeaning,
        phonetic: word.phonetic
      },
      fallback
    );
    setGenExample(r.data);
    setGenSource(r.source);
    setGenReason(r.reason);
    if (r.source === "minimax") {
      storage.setWordExample(word.id, r.data);
    }
  };

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
    <Card padding="none" className="space-y-3 p-4 sm:space-y-5 sm:p-8">
      <div className="space-y-3 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-3 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end gap-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{word.word}</h2>
            <span className="pb-1 text-sm text-ink-soft">{word.phonetic}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs muted">
            <span className="pill">{word.wordList}</span>
            <SrsStatusBadge progress={progress} variant="compact" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <div>
          <div className="text-xs muted">中文意思</div>
          <div className="mt-0.5 text-base sm:mt-1">
            <ChineseMeaningParts text={word.chineseMeaning} />
          </div>
        </div>
        {word.englishDefinition ? (
          <div>
            <div className="text-xs muted">English Definition</div>
            <div className="mt-0.5 text-sm sm:mt-1 sm:text-base">{word.englishDefinition}</div>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl bg-bg-soft/60 p-3 sm:p-4">
        {word.exampleSentence ? (
          <>
            <div className="flex items-start gap-2 sm:gap-3">
              <p className="min-w-0 flex-1 font-serif text-[15px] leading-relaxed">
                &ldquo;{word.exampleSentence}&rdquo;
              </p>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:gap-2">
                <Button
                  variant="soft"
                  className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                  onClick={() => speak(word.exampleSentence, { voice })}
                  aria-label="播放例句"
                >
                  ▶
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                  onClick={() => speak(word.exampleSentence, { voice, rate: 0.7 })}
                  aria-label="慢速播放例句"
                >
                  慢
                </Button>
              </div>
            </div>
            {word.exampleTranslation ? (
              <p className="mt-2 text-sm muted">{word.exampleTranslation}</p>
            ) : null}
          </>
        ) : genExample ? (
          <>
            <div className="flex items-start gap-2 sm:gap-3">
              <p className="min-w-0 flex-1 font-serif text-[15px] leading-relaxed">
                &ldquo;{genExample.exampleSentence}&rdquo;
              </p>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:gap-2">
                <Button
                  variant="soft"
                  className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                  onClick={() => speak(genExample.exampleSentence, { voice })}
                  aria-label="播放例句"
                >
                  ▶
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                  onClick={() => speak(genExample.exampleSentence, { voice, rate: 0.7 })}
                  aria-label="慢速播放例句"
                >
                  慢
                </Button>
              </div>
            </div>
            <p className="mt-2 text-sm muted">{genExample.exampleTranslation}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-brand-700">💡 {genExample.memoryTip}</span>
              {genSource ? <AISourceBadge source={genSource === "loading" ? "minimax" : genSource} reason={genReason} /> : null}
              <button
                type="button"
                className="ml-auto text-xs muted hover:text-brand-700"
                onClick={handleGenerateExample}
                disabled={genSource === "loading"}
              >
                {genSource === "loading" ? "生成中..." : "重新生成"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <span className="text-sm muted">扫描书没有提供例句</span>
            <Button
              variant="soft"
              onClick={handleGenerateExample}
              disabled={genSource === "loading"}
            >
              {genSource === "loading" ? "生成中..." : "让 AI 写一句例句"}
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs text-brand-700 hover:underline"
            onClick={showGuide ? () => setShowGuide(false) : loadGuide}
          >
            {showGuide ? "收起怎么读" : "🔊 告诉我怎么读"}
          </button>
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
        {/* 移动端 SRS 详细徽章太占行, 紧凑变体已在头部出现, 这里详细版只在 sm+ 显示 */}
        <div className="hidden sm:block">
          <SrsStatusBadge progress={progress} variant="detailed" />
        </div>
        {/* 反馈三按钮: 所有屏幕都横向 3 列, 每个 min-h-12 拇指点击友好。
            手机原本 grid-cols-1 会一列三行, 多吃两屏高, 是用户滑不到"我会了"的主因 */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="soft"
            className="min-h-12 text-sm sm:text-base"
            onClick={() => handleFb("forget")}
          >
            不会
          </Button>
          <Button
            variant="soft"
            className="min-h-12 text-sm sm:text-base"
            onClick={() => handleFb("fuzzy")}
          >
            模糊
          </Button>
          <Button
            variant="primary"
            className="min-h-12 text-sm sm:text-base"
            onClick={() => handleFb("remember")}
          >
            我会了
          </Button>
        </div>
      </div>

      <div>
        <button
          type="button"
          className="text-xs muted hover:text-brand-700"
          onClick={() => setShowSentenceBox((v) => !v)}
        >
          {showSentenceBox ? "收起造句" : "+ 用这个词造一句(雅思相关最佳)"}
        </button>
        {showSentenceBox ? (
          <div className="mt-2">
            <div className="mb-1 flex items-center gap-2 text-xs muted">
              提交后 AI 会给点评
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
        ) : null}
      </div>
    </Card>
  );
}

