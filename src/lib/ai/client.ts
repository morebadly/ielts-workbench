import type { AICapability } from "./prompts";

export type AISource = "minimax" | "mock";

export interface AIResult<T> {
  data: T;
  source: AISource;
  reason?: string;
}

export interface PronunciationData {
  syllables: string[];
  stressIndex: number;
  chineseHint: string;
  commonMistakes: string[];
}

export interface SentenceFeedbackData {
  grammarIssues: string[];
  moreNatural: string;
  ieltsUsage: string;
  comments: string;
}

export interface DictationFeedbackData {
  correct: boolean;
  diff: string;
  memoryTip: string;
}

export interface VocabArticleData {
  title: string;
  topic: string;
  body: string;
}

export interface WritingTask1Data {
  hasOverview: boolean;
  capturesMainTrend: boolean;
  dataAccuracy: number;
  comparisonNatural: number;
  grammarIssues: string[];
  vocabIssues: string[];
  comments: string;
  revisedVersion: string;
}

export interface WritingTask2Data {
  positionClear: boolean;
  argumentStrength: number;
  paragraphLogic: number;
  vocabRepetition: number;
  grammarIssues: string[];
  vocabIssues: string[];
  comments: string;
  revisedVersion: string;
}

type CapabilityMap = {
  pronunciation: PronunciationData;
  sentenceFeedback: SentenceFeedbackData;
  dictationFeedback: DictationFeedbackData;
  vocabArticle: VocabArticleData;
  writingTask1: WritingTask1Data;
  writingTask2: WritingTask2Data;
};

interface CallOpts {
  signal?: AbortSignal;
}

export async function callAI<K extends AICapability>(
  capability: K,
  payload: Record<string, unknown>,
  fallback: () => CapabilityMap[K],
  opts: CallOpts = {}
): Promise<AIResult<CapabilityMap[K]>> {
  try {
    const resp = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capability, payload }),
      signal: opts.signal
    });
    if (resp.status === 503) {
      return {
        data: fallback(),
        source: "mock",
        reason: "未配置 MINIMAX_API_KEY,使用本地 mock 结果"
      };
    }
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      return {
        data: fallback(),
        source: "mock",
        reason: `AI 调用失败: ${(errBody as { detail?: string }).detail || resp.statusText}`
      };
    }
    const json = (await resp.json()) as { data: CapabilityMap[K] };
    return { data: json.data, source: "minimax" };
  } catch (e) {
    return {
      data: fallback(),
      source: "mock",
      reason: `网络错误: ${(e as Error).message}`
    };
  }
}

export async function isAIConfigured(): Promise<boolean> {
  try {
    const r = await fetch("/api/ai/chat");
    if (!r.ok) return false;
    const j = (await r.json()) as { configured?: boolean };
    return Boolean(j.configured);
  } catch {
    return false;
  }
}
