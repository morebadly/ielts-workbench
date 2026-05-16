"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AISourceBadge } from "@/components/ui/AISourceBadge";
import { AIResultNotice } from "@/components/ai/AIResultNotice";
import { speak } from "@/lib/tts";
import { gradeFillInSentence, gradeSentence, gradeWord } from "@/lib/grading";
import {
  callAI,
  type AISource,
  type DictationFeedbackData,
  type GenerateExampleData
} from "@/lib/ai/client";
import { storage } from "@/lib/storage";
import type { DictationMode, Word } from "@/types";

interface Props {
  words: Word[];
  mode: DictationMode;
  voice: "uk" | "us";
  onResult: (correct: boolean) => void;
  onFinish?: () => void;
}

const MODE_LABEL: Record<DictationMode, string> = {
  listenWriteWord: "听音写词",
  chineseToEnglish: "中文写英文",
  fillInSentence: "句子挖空",
  listenWriteSentence: "听句子默写"
};

function makeBlank(sentence: string, target: string): string {
  const re = new RegExp(`\\b${target}\\b`, "i");
  if (!re.test(sentence)) return sentence;
  return sentence.replace(re, "_____");
}

export function DictationPanel({ words, mode, voice, onResult, onFinish }: Props) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    expected: string;
    reason?: string;
  } | null>(null);
  const [aiFeedback, setAiFeedback] = useState<DictationFeedbackData | null>(null);
  const [aiSource, setAiSource] = useState<AISource | "loading" | null>(null);
  const [aiReason, setAiReason] = useState<string | undefined>();
  const [aiErrorCode, setAiErrorCode] = useState<string | undefined>();

  const current = words[idx];

  // v1.10: 扫描书没有原始例句, 默写"句子挖空"和"听句子默写"模式必须有例句,
  // 这里按需走 generateExample (AI) + storage 缓存, 跟 WordCard 用同一份缓存。
  const [genSentence, setGenSentence] = useState<string>("");
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    if (!current) return;
    setGenSentence("");
    if (current.exampleSentence) return;
    // 先查缓存
    const cached = storage.getWordExamples()[current.id];
    if (cached) {
      setGenSentence(cached.exampleSentence);
      return;
    }
    // 不在挖空 / 听句模式不预生成, 节省 token
    if (mode !== "fillInSentence" && mode !== "listenWriteSentence") return;
    let cancelled = false;
    (async () => {
      setGenLoading(true);
      const fallback = (): GenerateExampleData => ({
        exampleSentence: `${current.word} is commonly used in academic English.`,
        exampleTranslation: `${current.chineseMeaning.split(/[;,。;,]/)[0] || current.word} 在学术英语中很常用。`,
        memoryTip: ""
      });
      const r = await callAI(
        "generateExample",
        {
          word: current.word,
          chineseMeaning: current.chineseMeaning,
          phonetic: current.phonetic
        },
        fallback
      );
      if (cancelled) return;
      setGenSentence(r.data.exampleSentence);
      setGenLoading(false);
      if (r.source === "minimax") {
        storage.setWordExample(current.id, r.data);
      }
    })();
    return () => {
      cancelled = true;
    };
    // 例句生成只跟当前词的 id 和模式相关, current 整体引用变化无需重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, mode]);

  // 最终用于展示/朗读/挖空的句子: 优先原始, 其次 AI 生成
  const effectiveSentence = current?.exampleSentence || genSentence || "";

  useEffect(() => {
    setInput("");
    setFeedback(null);
    setAiFeedback(null);
    setAiSource(null);
    if (mode === "listenWriteWord" && current) {
      speak(current.word, { voice });
    } else if (mode === "listenWriteSentence" && current && effectiveSentence) {
      speak(effectiveSentence, { voice });
    }
    // 切词/切模式时重置输入并自动朗读, voice 是用户偏好不需要触发自动朗读
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mode, current?.id, effectiveSentence]);

  const display = useMemo(() => {
    if (!current) return null;
    switch (mode) {
      case "listenWriteWord":
        return (
          <div className="space-y-2">
            <p className="muted text-sm">听到了吗?把它写出来。</p>
            <Button variant="soft" onClick={() => speak(current.word, { voice })}>
              ▶ 再播一次
            </Button>
            <Button
              variant="ghost"
              className="ml-2"
              onClick={() => speak(current.word, { voice, rate: 0.7 })}
            >
              慢速
            </Button>
          </div>
        );
      case "chineseToEnglish":
        return (
          <div>
            <p className="muted text-sm">看中文,写英文单词。</p>
            <p className="mt-2 text-lg font-medium">{current.chineseMeaning}</p>
          </div>
        );
      case "fillInSentence":
        return (
          <div>
            <p className="muted text-sm">补全空缺的单词。</p>
            {effectiveSentence ? (
              <p className="mt-2 font-serif text-[15px] leading-relaxed">
                {makeBlank(effectiveSentence, current.word)}
              </p>
            ) : (
              <p className="mt-2 text-sm muted">
                {genLoading
                  ? "正在为这个词生成例句..."
                  : "这本书的词没有原始例句, 准备调用 AI 生成中..."}
              </p>
            )}
          </div>
        );
      case "listenWriteSentence":
        return (
          <div className="space-y-2">
            <p className="muted text-sm">
              {effectiveSentence
                ? "听整句,完整地默写下来。"
                : genLoading
                ? "正在为这个词生成例句..."
                : "这本书的词没有原始例句, 准备调用 AI 生成中..."}
            </p>
            <Button
              variant="soft"
              disabled={!effectiveSentence}
              onClick={() => speak(effectiveSentence, { voice })}
            >
              ▶ 再听一次
            </Button>
            <Button
              variant="ghost"
              className="ml-2"
              disabled={!effectiveSentence}
              onClick={() => speak(effectiveSentence, { voice, rate: 0.7 })}
            >
              慢速
            </Button>
          </div>
        );
    }
  }, [mode, current, voice, effectiveSentence, genLoading]);

  if (!current) return null;

  const handleCheck = () => {
    let result;
    if (mode === "listenWriteWord" || mode === "chineseToEnglish") {
      result = gradeWord(input, current.word);
    } else if (mode === "fillInSentence") {
      result = gradeFillInSentence(input, current.word);
    } else {
      result = gradeSentence(input, effectiveSentence);
    }
    setFeedback({
      correct: result.correct,
      expected:
        mode === "listenWriteSentence" ? effectiveSentence : current.word,
      reason: result.reason
    });
    onResult(result.correct);
  };

  const handleAIExplain = async () => {
    if (!feedback || feedback.correct || !current) return;
    setAiSource("loading");
    const expected = mode === "listenWriteSentence" ? effectiveSentence : current.word;
    const fallback = (): DictationFeedbackData => ({
      correct: false,
      diff: feedback.reason || "拼写或顺序与正确答案不一致",
      memoryTip: "把正确答案抄写两遍再读出声,会记得更牢。"
    });
    const r = await callAI(
      "dictationFeedback",
      {
        expected,
        got: input,
        kind: mode === "listenWriteSentence" ? "sentence" : "word"
      },
      fallback
    );
    setAiFeedback(r.data);
    setAiSource(r.source);
    setAiReason(r.reason);
    setAiErrorCode(r.errorCode);
  };

  const handleNext = () => {
    if (idx + 1 >= words.length) {
      onFinish?.();
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <Card padding="lg" className="space-y-4">
      <CardHeader
        title={MODE_LABEL[mode]}
        subtitle={`第 ${idx + 1} / ${words.length} 题`}
      />
      {display}
      <textarea
        className={mode === "listenWriteSentence" ? "textarea" : "input"}
        rows={mode === "listenWriteSentence" ? 4 : 1}
        placeholder={
          mode === "listenWriteSentence" ? "完整默写听到的句子" : "输入单词"
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && mode !== "listenWriteSentence") {
            e.preventDefault();
            if (!feedback) handleCheck();
            else handleNext();
          }
        }}
      />

      {feedback ? (
        <div
          className={
            feedback.correct
              ? "rounded-xl bg-brand-100 p-3 text-sm text-brand-700"
              : "rounded-xl bg-accent-rose/10 p-3 text-sm"
          }
        >
          {feedback.correct ? (
            <span>✓ 正确</span>
          ) : (
            <div>
              <div>✗ {feedback.reason || "再试一次"}</div>
              <div className="mt-1 muted">正确答案:{feedback.expected}</div>
              <div className="mt-2 flex items-center gap-2">
                <Button variant="ghost" onClick={handleAIExplain}>
                  让 AI 讲讲哪里错了
                </Button>
                {aiSource ? <AISourceBadge source={aiSource} reason={aiReason} /> : null}
              </div>
              {aiFeedback ? (
                <div className="mt-2 space-y-2">
                  {aiSource === "mock" ? (
                    <AIResultNotice
                      source="mock"
                      reason={aiReason}
                      errorCode={aiErrorCode}
                    />
                  ) : null}
                  <div className="rounded-lg bg-bg-card p-3 text-ink">
                    <div className="text-xs muted">差异</div>
                    <p>{aiFeedback.diff}</p>
                    <div className="mt-2 text-xs muted">记忆提示</div>
                    <p>{aiFeedback.memoryTip}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleNext}>
          跳过
        </Button>
        {!feedback ? (
          <Button onClick={handleCheck}>检查</Button>
        ) : (
          <Button onClick={handleNext}>下一题</Button>
        )}
      </div>
    </Card>
  );
}

export const DICTATION_MODE_LABEL = MODE_LABEL;
