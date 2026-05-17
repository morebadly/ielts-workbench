import simonRaw from "./simonEssays.json";

export interface SimonEssay {
  id: string;
  titleZh: string;
  taskType: "task1" | "task2";
  promptText: string;
  essay: string;
  wordCount: number;
  band: number;
}

interface RawSimonEssay {
  titleZh?: string;
  taskType?: "task1" | "task2" | string;
  promptText?: string;
  essay?: string;
  wordCount?: number | null;
  band?: number | null;
}

/**
 * 计算英文单词数 (空格切分, 过滤空串)。
 */
function countWords(s: string): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * 适配 Simon 范文原始 JSON。
 * - taskType 兜底 task2
 * - wordCount 缺失时自己数
 * - band 缺失时默认 9 (Simon 范文全是 9 分)
 */
function adapt(raw: RawSimonEssay, idx: number): SimonEssay {
  const taskType = raw.taskType === "task1" ? "task1" : "task2";
  const essay = (raw.essay || "").trim();
  const wordCount =
    typeof raw.wordCount === "number" && raw.wordCount > 0
      ? raw.wordCount
      : countWords(essay);
  const band = typeof raw.band === "number" && raw.band > 0 ? raw.band : 9;
  return {
    id: `simon-${idx}`,
    titleZh: raw.titleZh || `Simon 范文 ${idx + 1}`,
    taskType,
    promptText: (raw.promptText || "").trim(),
    essay,
    wordCount,
    band
  };
}

export const SIMON_ESSAYS: SimonEssay[] = (simonRaw as RawSimonEssay[])
  .filter((e) => (e.essay || "").trim().length > 100)
  .map(adapt);

/**
 * 给定题干, 找匹配的 Simon 范文 (相同题目优先, 次之关键词重合度)。
 *
 * 用于"看 Simon 怎么写"按钮: 用户在写真题, 点一下就能看一篇风格相近的官方范文。
 */
export function findSimonEssayForPrompt(promptText: string): SimonEssay | null {
  if (!promptText) return null;
  const target = promptText.toLowerCase().replace(/\s+/g, " ").trim();
  if (!target) return null;

  // 1) 完全或大部分一致
  for (const e of SIMON_ESSAYS) {
    const p = e.promptText.toLowerCase().replace(/\s+/g, " ").trim();
    if (!p) continue;
    if (p === target) return e;
    // 80% 字符前缀重合也算
    const minLen = Math.min(p.length, target.length);
    if (minLen > 60 && p.slice(0, 60) === target.slice(0, 60)) return e;
  }

  // 2) 关键词重合度 (取 8 个最长 word 计算)
  const targetWords = new Set(
    target
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 5)
      .slice(0, 12)
  );
  if (!targetWords.size) return null;
  let bestScore = 0;
  let best: SimonEssay | null = null;
  for (const e of SIMON_ESSAYS) {
    const p = e.promptText.toLowerCase();
    let score = 0;
    for (const w of targetWords) if (p.includes(w)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  // 至少匹中 3 个关键词才推
  return bestScore >= 3 ? best : null;
}
