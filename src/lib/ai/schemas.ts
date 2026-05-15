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

const writingHighlight = z.object({
  excerpt: z.string(),
  category: z.enum(["grammar", "vocabulary", "coherence", "task_response"]),
  comment: z.string(),
  suggestion: z.string().optional(),
  severity: z.enum(["info", "warning", "error"]).optional()
});

const writingTask1 = z.object({
  hasOverview: z.boolean(),
  capturesMainTrend: z.boolean(),
  dataAccuracy: z.number(),
  comparisonNatural: z.number(),
  grammarIssues: z.array(z.string()),
  vocabIssues: z.array(z.string()),
  comments: z.string(),
  revisedVersion: z.string(),
  highlights: z.array(writingHighlight).optional()
}) satisfies z.ZodType<WritingTask1Data>;

const writingTask2 = z.object({
  positionClear: z.boolean(),
  argumentStrength: z.number(),
  paragraphLogic: z.number(),
  vocabRepetition: z.number(),
  grammarIssues: z.array(z.string()),
  vocabIssues: z.array(z.string()),
  comments: z.string(),
  revisedVersion: z.string(),
  highlights: z.array(writingHighlight).optional()
}) satisfies z.ZodType<WritingTask2Data>;

const NEWS_TOPICS = [
  "education",
  "technology",
  "environment",
  "society",
  "health",
  "work"
] as const;

const newsLearning = z.object({
  topic: z.enum(NEWS_TOPICS),
  learningSummary: z.string().min(50),
  vocabulary: z
    .array(
      z.object({
        word: z.string().min(1),
        meaning: z.string().min(1),
        example: z.string().min(1)
      })
    )
    .min(1),
  readingQuestions: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1)
      })
    )
    .min(1),
  writingPrompt: z.string().min(10),
  listeningText: z.string().min(50)
});

export type NewsLearningPacket = z.infer<typeof newsLearning>;

export const AI_SCHEMAS = {
  pronunciation,
  sentenceFeedback,
  dictationFeedback,
  vocabArticle,
  writingTask1,
  writingTask2,
  newsLearning
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
