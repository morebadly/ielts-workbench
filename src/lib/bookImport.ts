import type { VocabularyBook, Word } from "@/types";

export interface ParsedBook {
  book: VocabularyBook;
  words: Word[];
  warnings: string[];
}

export interface ParseError {
  line: number;
  message: string;
}

export class BookParseError extends Error {
  constructor(message: string, public details: ParseError[] = []) {
    super(message);
    this.name = "BookParseError";
  }
}

interface RawWord {
  day: number;
  word: string;
  phonetic?: string;
  chinese?: string;
  english?: string;
  example?: string;
  translation?: string;
  wordList?: string;
}

const FIELD_ALIASES: Record<string, keyof RawWord> = {
  day: "day",
  bookday: "day",
  word: "word",
  english: "english",
  englishdefinition: "english",
  definition: "english",
  meaning: "english",
  phonetic: "phonetic",
  phonetics: "phonetic",
  ipa: "phonetic",
  chinese: "chinese",
  chinesemeaning: "chinese",
  cn: "chinese",
  meaningcn: "chinese",
  example: "example",
  examplesentence: "example",
  sentence: "example",
  translation: "translation",
  exampletranslation: "translation",
  translatecn: "translation",
  category: "wordList",
  wordlist: "wordList",
  list: "wordList"
};

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[\s_\-]+/g, "");
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function buildBook(
  rawWords: RawWord[],
  meta: { name?: string; description?: string },
  bookIdHint?: string
): ParsedBook {
  if (rawWords.length === 0) {
    throw new BookParseError("没有解析到任何词条");
  }

  const days = rawWords.map((r) => r.day).filter((d) => d > 0);
  const totalDays = days.length ? Math.max(...days) : 1;

  const id =
    bookIdHint ||
    `book-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const book: VocabularyBook = {
    id,
    name: meta.name || "自定义词书",
    description: meta.description,
    totalDays
  };

  const dayCounters = new Map<number, number>();
  const words: Word[] = rawWords.map((r, i) => {
    const order = (dayCounters.get(r.day) || 0) + 1;
    dayCounters.set(r.day, order);
    return {
      id: `${id}-d${r.day}-${i + 1}`,
      word: r.word,
      phonetic: r.phonetic || "",
      chineseMeaning: r.chinese || "",
      englishDefinition: r.english || "",
      exampleSentence: r.example || "",
      exampleTranslation: r.translation || undefined,
      bookId: id,
      bookDay: r.day,
      wordList: r.wordList || `Day ${r.day}`,
      order
    };
  });

  const warnings: string[] = [];
  if (rawWords.some((r) => !r.chinese)) {
    warnings.push("有词条缺少中文释义,默写'中译英'模式可能受影响");
  }
  if (rawWords.some((r) => !r.example)) {
    warnings.push("有词条缺少例句,'句子挖空'和'听句默写'可能受影响");
  }
  if (rawWords.some((r) => !r.phonetic)) {
    warnings.push("有词条缺少音标,卡片上不会显示音标");
  }

  return { book, words, warnings };
}

export function parseCSV(text: string, opts: { name?: string } = {}): ParsedBook {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    throw new BookParseError("CSV 至少需要表头 + 1 行数据");
  }
  const header = parseCSVLine(lines[0]).map(normalizeKey);
  const fieldMap: Array<keyof RawWord | null> = header.map(
    (h) => FIELD_ALIASES[h] || null
  );

  if (!fieldMap.includes("word")) {
    throw new BookParseError("CSV 表头必须包含 word 列");
  }
  if (!fieldMap.includes("day")) {
    throw new BookParseError("CSV 表头必须包含 day 列");
  }

  const errors: ParseError[] = [];
  const raws: RawWord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const row: Partial<RawWord> = {};
    fieldMap.forEach((f, idx) => {
      if (!f) return;
      const v = cells[idx];
      if (v === undefined) return;
      if (f === "day") {
        const d = parseInt(v, 10);
        if (Number.isFinite(d) && d > 0) row.day = d;
      } else {
        (row as Record<string, string>)[f] = v;
      }
    });
    if (!row.word || !row.day) {
      errors.push({ line: i + 1, message: "缺少 word 或 day" });
      continue;
    }
    raws.push(row as RawWord);
  }
  if (raws.length === 0) {
    throw new BookParseError("没有有效词条", errors);
  }
  const result = buildBook(raws, { name: opts.name });
  if (errors.length) {
    result.warnings.unshift(`${errors.length} 行数据有问题,已跳过`);
  }
  return result;
}

export function parseJSON(text: string): ParsedBook {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new BookParseError("JSON 格式错误: " + (e as Error).message);
  }

  if (Array.isArray(parsed)) {
    const raws = parsed.map(normalizeJSONWord).filter((r): r is RawWord => Boolean(r));
    return buildBook(raws, { name: "自定义词书" });
  }

  const obj = parsed as {
    id?: string;
    name?: string;
    description?: string;
    words?: unknown[];
  };
  if (!obj.words || !Array.isArray(obj.words)) {
    throw new BookParseError("JSON 必须包含 words 数组");
  }
  const raws = obj.words
    .map(normalizeJSONWord)
    .filter((r): r is RawWord => Boolean(r));
  return buildBook(raws, { name: obj.name, description: obj.description }, obj.id);
}

function normalizeJSONWord(item: unknown): RawWord | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const day = Number(r.day ?? r.bookDay);
  const word = String(r.word ?? "").trim();
  if (!Number.isFinite(day) || day <= 0 || !word) return null;
  return {
    day,
    word,
    phonetic: r.phonetic ? String(r.phonetic) : undefined,
    chinese:
      r.chinese ? String(r.chinese) : r.chineseMeaning ? String(r.chineseMeaning) : undefined,
    english:
      r.english
        ? String(r.english)
        : r.englishDefinition
          ? String(r.englishDefinition)
          : undefined,
    example:
      r.example ? String(r.example) : r.exampleSentence ? String(r.exampleSentence) : undefined,
    translation:
      r.translation
        ? String(r.translation)
        : r.exampleTranslation
          ? String(r.exampleTranslation)
          : undefined,
    wordList: r.wordList ? String(r.wordList) : undefined
  };
}

export function parseAuto(text: string, fileName?: string): ParsedBook {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJSON(trimmed);
  }
  if (fileName?.toLowerCase().endsWith(".json")) {
    return parseJSON(trimmed);
  }
  return parseCSV(trimmed);
}

export const CSV_TEMPLATE = `day,word,phonetic,chinese,english,example,translation
1,significant,/sɪɡˈnɪfɪkənt/,显著的,important and noticeable,There was a significant increase in tourism.,旅游业出现显著增长。
1,fluctuate,/ˈflʌktʃueɪt/,波动,to change frequently in level or amount,Prices fluctuated wildly during the summer.,夏季价格剧烈波动。
2,facilitate,/fəˈsɪlɪteɪt/,促进,to make an action easier,Online learning has facilitated study for many students.,在线学习为许多学生提供了便利。
`;
