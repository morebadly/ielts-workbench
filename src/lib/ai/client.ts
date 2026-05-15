export type AISource = "minimax" | "mock";

export interface AIResult<T> {
  data: T;
  source: AISource;
  reason?: string;
  errorCode?: string;
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

export interface WritingHighlightData {
  excerpt: string;
  category: "grammar" | "vocabulary" | "coherence" | "task_response";
  comment: string;
  suggestion?: string;
  severity?: "info" | "warning" | "error";
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
  /** v1.8 新增, 老数据/老 mock 可能没有 */
  highlights?: WritingHighlightData[];
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
  /** v1.8 新增, 老数据/老 mock 可能没有 */
  highlights?: WritingHighlightData[];
}

type CapabilityMap = {
  pronunciation: PronunciationData;
  sentenceFeedback: SentenceFeedbackData;
  dictationFeedback: DictationFeedbackData;
  vocabArticle: VocabArticleData;
  writingTask1: WritingTask1Data;
  writingTask2: WritingTask2Data;
};

type ClientCapability = keyof CapabilityMap;

interface CallOpts {
  signal?: AbortSignal;
}

interface ServerOk<T> {
  ok: true;
  data: T;
  source?: AISource;
}
interface ServerErr {
  ok: false;
  error: string;
  detail?: string;
  source?: AISource;
}

export async function callAI<K extends ClientCapability>(
  capability: K,
  payload: Record<string, unknown>,
  fallback: () => CapabilityMap[K],
  opts: CallOpts = {}
): Promise<AIResult<CapabilityMap[K]>> {
  let resp: Response;
  try {
    resp = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capability, payload }),
      signal: opts.signal
    });
  } catch (e) {
    return {
      data: fallback(),
      source: "mock",
      reason: `网络错误: ${(e as Error).message}`,
      errorCode: "network_error"
    };
  }

  let json: ServerOk<CapabilityMap[K]> | ServerErr | null = null;
  try {
    json = (await resp.json()) as ServerOk<CapabilityMap[K]> | ServerErr;
  } catch {
    return {
      data: fallback(),
      source: "mock",
      reason: `服务端返回非 JSON (HTTP ${resp.status})`,
      errorCode: "bad_response"
    };
  }

  if (resp.ok && json && json.ok === true) {
    return {
      data: json.data,
      source: json.source || "minimax"
    };
  }

  if (json && json.ok === false) {
    return {
      data: fallback(),
      source: json.source || "mock",
      reason: json.detail || json.error,
      errorCode: json.error
    };
  }

  return {
    data: fallback(),
    source: "mock",
    reason: `HTTP ${resp.status}`,
    errorCode: "unknown_error"
  };
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
