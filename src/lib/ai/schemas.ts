import { z } from "zod";
import type {
  PronunciationData,
  SentenceFeedbackData,
  DictationFeedbackData,
  VocabArticleData,
  WritingTask1Data,
  WritingTask2Data
} from "@/lib/ai/client";

const pronunciation = z.object({
  syllables: z.array(z.string()),
  stressIndex: z.number().int().nonnegative(),
  chineseHint: z.string(),
  commonMistakes: z.array(z.string())
}) satisfies z.ZodType<PronunciationData>;

const sentenceFeedback = z.object({
  grammarIssues: z.array(z.string()),
  moreNatural: z.string(),
  ieltsUsage: z.string(),
  comments: z.string()
}) satisfies z.ZodType<SentenceFeedbackData>;

const dictationFeedback = z.object({
  correct: z.boolean(),
  diff: z.string(),
  memoryTip: z.string()
}) satisfies z.ZodType<DictationFeedbackData>;

const vocabArticle = z.object({
  title: z.string(),
  topic: z.string(),
  body: z.string()
}) satisfies z.ZodType<VocabArticleData>;

const writingTask1 = z.object({
  hasOverview: z.boolean(),
  capturesMainTrend: z.boolean(),
  dataAccuracy: z.number(),
  comparisonNatural: z.number(),
  grammarIssues: z.array(z.string()),
  vocabIssues: z.array(z.string()),
  comments: z.string(),
  revisedVersion: z.string()
}) satisfies z.ZodType<WritingTask1Data>;

const writingTask2 = z.object({
  positionClear: z.boolean(),
  argumentStrength: z.number(),
  paragraphLogic: z.number(),
  vocabRepetition: z.number(),
  grammarIssues: z.array(z.string()),
  vocabIssues: z.array(z.string()),
  comments: z.string(),
  revisedVersion: z.string()
}) satisfies z.ZodType<WritingTask2Data>;

export const AI_SCHEMAS = {
  pronunciation,
  sentenceFeedback,
  dictationFeedback,
  vocabArticle,
  writingTask1,
  writingTask2
} as const;

export type AICapabilityKey = keyof typeof AI_SCHEMAS;

export type AICapabilityResult<K extends AICapabilityKey> = z.infer<
  (typeof AI_SCHEMAS)[K]
>;

export class AISchemaError extends Error {
  capability: AICapabilityKey;
  issues: z.ZodIssue[];
  constructor(capability: AICapabilityKey, issues: z.ZodIssue[]) {
    const summary = issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    super(`AI 返回结构与 ${capability} schema 不匹配: ${summary}`);
    this.name = "AISchemaError";
    this.capability = capability;
    this.issues = issues;
  }
}

export function validateAIResult<K extends AICapabilityKey>(
  capability: K,
  data: unknown
): AICapabilityResult<K> {
  const schema = AI_SCHEMAS[capability];
  if (!schema) {
    throw new Error(`未知的 AI capability: ${capability}`);
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AISchemaError(capability, result.error.issues);
  }
  return result.data as AICapabilityResult<K>;
}

export function isAICapability(s: string): s is AICapabilityKey {
  return s in AI_SCHEMAS;
}
