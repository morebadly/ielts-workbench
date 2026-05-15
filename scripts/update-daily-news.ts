/**
 * scripts/update-daily-news.ts
 * 每日运行: 拉取/选 1-3 条新闻 -> 调 MiniMax 生成 IELTS 学习包 -> 写入 src/data/news/daily-news.json
 *
 * 原则:
 * - 永不抓取/保存正文。仅保存 title / source / url / publishedAt / originalSummary(短引用)
 * - learningSummary 由 AI 生成且明确标注
 * - MINIMAX_API_KEY 不存在或调用失败时, 用 mock seed 写入并清楚标注 aiSource: "mock"
 */
import { promises as fs } from "node:fs";
import path from "node:path";

interface DailyNewsVocabItem {
  word: string;
  meaning: string;
  example: string;
}
interface DailyNewsReadingQA {
  question: string;
  answer: string;
}
interface DailyNewsItem {
  id: string;
  date: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  topic: string;
  originalSummary: string;
  learningSummary: string;
  vocabulary: DailyNewsVocabItem[];
  readingQuestions: DailyNewsReadingQA[];
  writingPrompt: string;
  listeningText: string;
  createdAt: string;
  aiSource?: "minimax" | "mock";
}

interface RawSeed {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  originalSummary: string;
}

const OUT_FILE = path.resolve("src/data/news/daily-news.json");
const MAX_HISTORY = 30;

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

const NEWS_SYSTEM =
  "You are a precise IELTS coach assistant. When asked for JSON, you return strict JSON only, no markdown, no commentary.";

function buildPrompt(seed: RawSeed): string {
  return `You are an IELTS reading and writing coach. Build a self-contained learning packet from a news headline + RSS summary, NOT from full article text.

News title: ${seed.title}
Source: ${seed.source}
Published at: ${seed.publishedAt}
Original RSS summary (do NOT copy verbatim):
"""
${seed.originalSummary}
"""

Constraints:
- learningSummary and listeningText must be your own paraphrase, IELTS reading register, NOT a copy of the original article.
- vocabulary must be exactly 5 IELTS Band 6.5+ items.
- readingQuestions must be exactly 3, mix of detail/inference/vocab-in-context. Answers in English.
- writingPrompt must look like an IELTS Task 2 essay question.
- topic must be one of: education|technology|environment|society|health|work.

Return STRICT JSON, no markdown:
{
  "topic": "<one of the 6>",
  "learningSummary": "<120-180 English words>",
  "vocabulary": [{ "word": "", "meaning": "", "example": "" }],
  "readingQuestions": [{ "question": "", "answer": "" }],
  "writingPrompt": "<Task 2 question>",
  "listeningText": "<120-180 English words for TTS>"
}`;
}

function stripJsonFence(s: string): string {
  const t = s.trim();
  const m = t.match(/```json\s*([\s\S]*?)```/i) || t.match(/```\s*([\s\S]*?)```/);
  if (m) return m[1].trim();
  if (t.startsWith("{") || t.startsWith("[")) return t;
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a >= 0 && b > a) return t.slice(a, b + 1);
  return t;
}

async function callMiniMax(seed: RawSeed): Promise<unknown> {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) throw new Error("no_api_key");
  const baseUrl = (process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1").replace(/\/+$/, "");
  const chatPath = process.env.MINIMAX_CHAT_PATH || "/chat/completions";
  const model = process.env.MINIMAX_TEXT_MODEL || "MiniMax-M2.7";

  const resp = await fetch(`${baseUrl}${chatPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: NEWS_SYSTEM },
        { role: "user", content: buildPrompt(seed) }
      ],
      temperature: 0.4,
      max_completion_tokens: 1800,
      response_format: { type: "json_object" }
    })
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 300)}`);
  }
  const j = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = j.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty content");
  return JSON.parse(stripJsonFence(content));
}

interface AIPacket {
  topic: string;
  learningSummary: string;
  vocabulary: DailyNewsVocabItem[];
  readingQuestions: DailyNewsReadingQA[];
  writingPrompt: string;
  listeningText: string;
}

function isValid(p: unknown): p is AIPacket {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.topic === "string" &&
    typeof o.learningSummary === "string" &&
    Array.isArray(o.vocabulary) &&
    Array.isArray(o.readingQuestions) &&
    typeof o.writingPrompt === "string" &&
    typeof o.listeningText === "string"
  );
}

const MOCK_SEEDS: RawSeed[] = [
  {
    title: "Why universities are rethinking written exams in the age of AI",
    source: "Mock IELTS Wire",
    url: "https://example.com/news/ai-and-exams",
    publishedAt: new Date().toISOString(),
    originalSummary:
      "As generative AI tools become widespread, several universities are piloting oral defenses, in-class essays and project-based portfolios to verify what students have actually learned."
  },
  {
    title: "City pilots free public transport on weekends to ease congestion",
    source: "Mock IELTS Wire",
    url: "https://example.com/news/free-transport",
    publishedAt: new Date().toISOString(),
    originalSummary:
      "A European city is offering free weekend bus and tram rides for six months to study whether free public transport reduces car traffic and air pollution."
  }
];

function buildMockPacket(seed: RawSeed): AIPacket {
  return {
    topic: "society",
    learningSummary: `(Mock learning summary based on the headline.) ${seed.title}. This paraphrase explains the situation in plain IELTS-friendly English, replacing the original RSS summary with a neutral overview suitable for reading practice. Configure MINIMAX_API_KEY to get an AI-generated version.`,
    vocabulary: [
      {
        word: "pilot",
        meaning: "(v.) 试运行;试点",
        example: "The government is piloting a new programme in three cities."
      },
      {
        word: "widespread",
        meaning: "(adj.) 广泛的",
        example: "Concerns about online safety are now widespread."
      },
      {
        word: "verify",
        meaning: "(v.) 核实;证实",
        example: "Teachers need ways to verify what students have actually learned."
      },
      {
        word: "outsource",
        meaning: "(v.) 外包",
        example: "Some students try to outsource essays to AI tools."
      },
      {
        word: "stressful",
        meaning: "(adj.) 让人有压力的",
        example: "Frequent oral exams can feel stressful for shy students."
      }
    ],
    readingQuestions: [
      {
        question: "What is the main idea of the article?",
        answer: "(Mock) A summary answer based only on the headline."
      },
      {
        question: "Why is this development considered important?",
        answer: "(Mock) Because it affects how students or citizens learn or behave."
      },
      {
        question: "What does the writer suggest as the next step?",
        answer: "(Mock) Further evaluation before scaling up."
      }
    ],
    writingPrompt:
      "Some people think governments should fund pilot programmes that test new public ideas, while others believe such money should go directly to existing services. Discuss both views and give your own opinion.",
    listeningText: `(Mock listening passage.) ${seed.title}. This is a neutral, IELTS-style spoken paraphrase based only on the headline and the short RSS summary. It is rewritten so that you can practice listening without infringing on the original publisher's content.`
  };
}

interface NewsFile {
  version: number;
  updatedAt: string;
  items: DailyNewsItem[];
}

async function loadExisting(): Promise<NewsFile> {
  try {
    const raw = await fs.readFile(OUT_FILE, "utf8");
    const parsed = JSON.parse(raw) as NewsFile;
    if (parsed.items && Array.isArray(parsed.items)) return parsed;
  } catch {
    /* no file yet */
  }
  return { version: 1, updatedAt: new Date().toISOString(), items: [] };
}

async function main() {
  const seeds = MOCK_SEEDS.slice(0, 2);
  const date = todayKey();
  const built: DailyNewsItem[] = [];

  for (const [idx, seed] of seeds.entries()) {
    let packet: AIPacket;
    let aiSource: "minimax" | "mock" = "mock";
    try {
      const raw = await callMiniMax(seed);
      if (!isValid(raw)) throw new Error("invalid AI shape");
      packet = raw;
      aiSource = "minimax";
      console.log(`[${idx + 1}/${seeds.length}] MiniMax OK:`, seed.title);
    } catch (e) {
      packet = buildMockPacket(seed);
      console.warn(
        `[${idx + 1}/${seeds.length}] fallback to mock for "${seed.title}":`,
        (e as Error).message
      );
    }

    built.push({
      id: `news-${date}-${idx + 1}-${slug(seed.title)}`,
      date,
      title: seed.title,
      source: seed.source,
      url: seed.url,
      publishedAt: seed.publishedAt,
      topic: packet.topic,
      originalSummary: seed.originalSummary,
      learningSummary: packet.learningSummary,
      vocabulary: packet.vocabulary.slice(0, 5),
      readingQuestions: packet.readingQuestions.slice(0, 3),
      writingPrompt: packet.writingPrompt,
      listeningText: packet.listeningText,
      createdAt: new Date().toISOString(),
      aiSource
    });
  }

  const existing = await loadExisting();
  const otherDays = existing.items.filter((it) => it.date !== date);
  const merged = [...built, ...otherDays].slice(0, MAX_HISTORY);

  const out: NewsFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items: merged
  };
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(
    `Wrote ${OUT_FILE}: ${built.length} new for ${date}, ${merged.length} total`
  );
}

main().catch((e) => {
  console.error("update-daily-news failed:", e);
  process.exit(1);
});
