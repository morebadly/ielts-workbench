import type { WritingPrompt } from "@/types";
import { MOCK_WRITING_PROMPTS } from "@/data/mockWriting";
import realPromptsRaw from "@/data/realWritingPrompts.json";

/**
 * 真题 JSON 里的原始结构 (脚本 scripts/extract-task-a.mjs 输出)
 * 不一定每个字段都有, 用 partial。
 */
interface RawRealPrompt {
  taskType?: "task1" | "task2";
  date?: string;
  promptText?: string;
  category?: string | null;
  chartType?: string | null;
  sourceFile?: string;
}

/**
 * 把真题 raw 转成 WritingPrompt 标准结构。
 */
function adaptRealPrompt(raw: RawRealPrompt, idx: number): WritingPrompt {
  const taskType = raw.taskType === "task1" ? "task1" : "task2";
  const dateStr = (raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) ? raw.date : "";
  const tagBits: string[] = [];
  if (dateStr) tagBits.push(dateStr);
  if (raw.category && raw.category !== "Other") tagBits.push(raw.category);
  if (raw.chartType) tagBits.push(raw.chartType);
  const title = `真题 · ${tagBits.join(" · ") || `条目 ${idx + 1}`}`;

  return {
    id: `real-${dateStr || "x"}-${idx}`,
    taskType,
    title,
    promptText: raw.promptText || "",
    minWords: taskType === "task1" ? 150 : 250,
    recommendedMinutes: taskType === "task1" ? 20 : 40,
    recommendedParagraphs: 4
  };
}

/**
 * 真题题库 (按 JSON 中的顺序: 已经是日期降序, 新的在前)。
 * 过滤掉 promptText 为空或过短的脏数据。
 */
export const REAL_WRITING_PROMPTS: WritingPrompt[] = (realPromptsRaw as RawRealPrompt[])
  .filter((p) => (p.promptText || "").trim().length >= 30)
  .map(adaptRealPrompt);

/**
 * 真题原始数据 (含 date/category/chartType, 用于题库浏览器筛选)。
 * 跟 REAL_WRITING_PROMPTS 等长, 索引一一对应。
 */
export const REAL_WRITING_PROMPTS_META: RawRealPrompt[] = (
  realPromptsRaw as RawRealPrompt[]
).filter((p) => (p.promptText || "").trim().length >= 30);

/**
 * 全部题目 (mock 在前面优先曝光, 真题在后)。
 */
export const ALL_WRITING_PROMPTS: WritingPrompt[] = [
  ...MOCK_WRITING_PROMPTS,
  ...REAL_WRITING_PROMPTS
];

/**
 * 按 taskType 取题目, 用于机考页 select。
 */
export function getPromptsByTask(taskType: "task1" | "task2"): WritingPrompt[] {
  return ALL_WRITING_PROMPTS.filter((p) => p.taskType === taskType);
}
