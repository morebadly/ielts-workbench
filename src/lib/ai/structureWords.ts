import "server-only";
import { chatJSON, chatVisionJSON, SYSTEM_PROMPT } from "@/lib/ai/minimax";
import { PROMPTS } from "@/lib/ai/prompts";
import type { ImportedWord } from "@/types";

interface AIWordItem {
  word?: string;
  phonetic?: string;
  chineseMeaning?: string;
  englishDefinition?: string;
  exampleSentence?: string;
  bookDay?: string;
  wordList?: string;
  order?: number;
}

interface AICorrection {
  from?: string;
  to?: string;
  reason?: string;
}

interface StructureResp {
  words?: AIWordItem[];
  corrections?: AICorrection[];
}

export interface WordCorrection {
  from: string;
  to: string;
  reason: string;
}

const MAX_CHARS_PER_CHUNK = 9000;

function chunk(text: string): string[] {
  if (text.length <= MAX_CHARS_PER_CHUNK) return [text];
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(text.length, i + MAX_CHARS_PER_CHUNK);
    if (end < text.length) {
      const breakAt = text.lastIndexOf("\n", end);
      if (breakAt > i + MAX_CHARS_PER_CHUNK / 2) end = breakAt;
    }
    out.push(text.slice(i, end));
    i = end;
  }
  return out;
}

function dedupe(words: ImportedWord[]): ImportedWord[] {
  const seen = new Set<string>();
  const out: ImportedWord[] = [];
  for (const w of words) {
    const key = w.word.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

export async function structureWordsFromText(
  rawText: string,
  bookTitle: string,
  opts: { hint?: string; pageOffset?: number } = {}
): Promise<{
  words: ImportedWord[];
  chunks: number;
  corrections: WordCorrection[];
}> {
  const chunks = chunk(rawText);
  const all: ImportedWord[] = [];
  const corrections: WordCorrection[] = [];
  let order = 1;

  for (const piece of chunks) {
    const data = await chatJSON<StructureResp>(
      SYSTEM_PROMPT,
      PROMPTS.structureWords(piece, bookTitle, opts.hint),
      { temperature: 0.1, maxTokens: 4000 }
    );
    const items = Array.isArray(data.words) ? data.words : [];
    for (const it of items) {
      const word = (it.word || "").trim();
      const cn = (it.chineseMeaning || "").trim();
      if (!word || !cn) continue;
      all.push({
        word,
        phonetic: it.phonetic || undefined,
        chineseMeaning: cn,
        englishDefinition: it.englishDefinition || undefined,
        exampleSentence: it.exampleSentence || undefined,
        bookTitle,
        bookDay: it.bookDay || undefined,
        wordList: it.wordList || undefined,
        order: order++
      });
    }
    // 收集 AI 报告的 OCR / 拼写更正
    const cs = Array.isArray(data.corrections) ? data.corrections : [];
    for (const c of cs) {
      const from = (c.from || "").trim();
      const to = (c.to || "").trim();
      if (!from || !to || from === to) continue;
      // 去重: from 已经记录过就跳过
      if (corrections.some((x) => x.from === from)) continue;
      corrections.push({ from, to, reason: (c.reason || "").trim() || "AI 修正" });
    }
  }

  return {
    words: dedupe(all),
    chunks: chunks.length,
    corrections: corrections.slice(0, 50)
  };
}

/**
 * v1.8.3:扫描版 PDF 看图识词。
 *
 * 流程:浏览器把 PDF 渲染成 JPEG → 客户端分批 (3-6 张) POST 到这里
 * → 调 MiniMax 视觉模型 → 让 AI 直接看图返结构化词条。
 *
 * @param images 形如 "data:image/jpeg;base64,..." 的字符串数组,客户端分批传入
 * @param bookTitle 词书标题(用于 prompt 提示词)
 * @param hint 可选的"用户提示",比如"这是 7 天 PDF, 每天 80 词"
 */
export async function structureWordsFromImages(
  images: string[],
  bookTitle: string,
  hint?: string
): Promise<{ words: ImportedWord[] }> {
  const valid = images.filter(
    (s) => typeof s === "string" && s.startsWith("data:image/")
  );
  if (!valid.length) return { words: [] };

  const data = await chatVisionJSON<StructureResp>(
    SYSTEM_PROMPT,
    PROMPTS.structureWords(
      "(图片在下方,请直接从扫描图中识别词条,不要因为图片质量低就放弃,尽量识别能看清的英文单词、音标、中文释义和例句)",
      bookTitle,
      hint
    ),
    valid.map((dataUrl) => ({ dataUrl, detail: "high" as const })),
    { temperature: 0.1, maxTokens: 4000 }
  );

  const out: ImportedWord[] = [];
  let order = 1;
  const items = Array.isArray(data.words) ? data.words : [];
  for (const it of items) {
    const word = (it.word || "").trim();
    const cn = (it.chineseMeaning || "").trim();
    if (!word || !cn) continue;
    out.push({
      word,
      phonetic: it.phonetic || undefined,
      chineseMeaning: cn,
      englishDefinition: it.englishDefinition || undefined,
      exampleSentence: it.exampleSentence || undefined,
      bookTitle,
      bookDay: it.bookDay || undefined,
      wordList: it.wordList || undefined,
      order: order++
    });
  }
  return { words: dedupe(out) };
}
