"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { speak } from "@/lib/tts";
import { gradeFillInSentence, gradeSentence, gradeWord } from "@/lib/grading";
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

  const current = words[idx];

  useEffect(() => {
    setInput("");
    setFeedback(null);
    if (mode === "listenWriteWord" && current) {
      speak(current.word, { voice });
    } else if (mode === "listenWriteSentence" && current) {
      speak(current.exampleSentence, { voice });
    }
  }, [idx, mode, current?.id]);

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
            <p className="mt-2 font-serif text-[15px] leading-relaxed">
              {makeBlank(current.exampleSentence, current.word)}
            </p>
          </div>
        );
      case "listenWriteSentence":
        return (
          <div className="space-y-2">
            <p className="muted text-sm">听整句,完整地默写下来。</p>
            <Button variant="soft" onClick={() => speak(current.exampleSentence, { voice })}>
              ▶ 再听一次
            </Button>
            <Button
              variant="ghost"
              className="ml-2"
              onClick={() => speak(current.exampleSentence, { voice, rate: 0.7 })}
            >
              慢速
            </Button>
          </div>
        );
    }
  }, [mode, current, voice]);

  if (!current) return null;

  const handleCheck = () => {
    let result;
    if (mode === "listenWriteWord" || mode === "chineseToEnglish") {
      result = gradeWord(input, current.word);
    } else if (mode === "fillInSentence") {
      result = gradeFillInSentence(input, current.word);
    } else {
      result = gradeSentence(input, current.exampleSentence);
    }
    setFeedback({
      correct: result.correct,
      expected:
        mode === "listenWriteSentence" ? current.exampleSentence : current.word,
      reason: result.reason
    });
    onResult(result.correct);
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
