import { normalizeAnswer } from "./utils";

export interface BasicGradingResult {
  correct: boolean;
  reason?: string;
  expected: string;
  got: string;
  diff?: { added: string[]; missing: string[] };
}

export function gradeWord(input: string, expected: string): BasicGradingResult {
  const got = normalizeAnswer(input);
  const exp = normalizeAnswer(expected);
  if (got === exp) {
    return { correct: true, expected, got: input.trim() };
  }
  return {
    correct: false,
    expected,
    got: input.trim(),
    reason: got.length === 0 ? "未输入" : "拼写不匹配"
  };
}

export function gradeSentence(input: string, expected: string): BasicGradingResult {
  const exp = normalizeAnswer(expected.replace(/[.,!?;:]/g, ""));
  const got = normalizeAnswer(input.replace(/[.,!?;:]/g, ""));
  if (got === exp) return { correct: true, expected, got: input.trim() };

  const expWords = exp.split(" ");
  const gotWords = got.split(" ");
  const missing = expWords.filter((w) => !gotWords.includes(w));
  const added = gotWords.filter((w) => !expWords.includes(w));

  return {
    correct: false,
    expected,
    got: input.trim(),
    reason: "句子与原文不一致",
    diff: { missing, added }
  };
}

export function gradeFillInSentence(input: string, expectedWord: string): BasicGradingResult {
  return gradeWord(input, expectedWord);
}

export interface AIGradingPlaceholder {
  type: "writing" | "dictation" | "article";
  payload: unknown;
}

export async function aiGrade(_p: AIGradingPlaceholder): Promise<null> {
  return null;
}
