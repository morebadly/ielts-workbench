import "server-only";
import { chatJSON, SYSTEM_PROMPT } from "@/lib/ai/minimax";
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

interface StructureResp {
  words?: AIWordItem[];
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
): Promise<{ words: ImportedWord[]; chunks: number }> {
  const chunks = chunk(rawText);
  const all: ImportedWord[] = [];
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
  }

  return { words: dedupe(all), chunks: chunks.length };
}
