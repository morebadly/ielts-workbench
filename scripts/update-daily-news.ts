/**
 * scripts/update-daily-news.ts
 *
 * 流程:
 *   1. 多源 RSS 拉取 (24h 内, 去重)
 *   2. 调 MiniMax 选 1-3 条 IELTS 友好新闻并打 topic
 *   3. 对每条调 MiniMax 生成 IELTS 学习包(摘要 / 词汇 / 阅读题 / 写作题 / 听力)
 *   4. 写入 src/data/news/daily-news.json (保留近 30 天)
 *
 * 任意阶段失败均自动 fallback, 标注 aiSource。
 *
 * 版权:
 * - 不抓正文页面, 仅保留 RSS 公开提供的 title / source / url / publishedAt / 简短 RSS 摘要
 * - learningSummary / listeningText 全部由 AI 改写, 标注 aiSource
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadLocalEnv } from "./lib/loadEnv";

// 在导入其他依赖之前加载 .env.local / .env (tsx 默认不自动加载)
loadLocalEnv();

import {
  DEFAULT_FEEDS,
  dedupSeeds,
  fetchAllFeeds,
  filterRecent,
  parseFeedsFromEnv,
  type RawSeed,
  type RssFeedSource
} from "./lib/rssFetcher";
import { selectSeeds, type SelectedSeed, type DailyNewsTopic } from "./lib/selectSeeds";

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
  topic: DailyNewsTopic;
  originalSummary: string;
  learningSummary: string;
  vocabulary: DailyNewsVocabItem[];
  readingQuestions: DailyNewsReadingQA[];
  writingPrompt: string;
  listeningText: string;
  createdAt: string;
  aiSource?: "minimax" | "mock";
}

interface NewsFile {
  version: number;
  updatedAt: string;
  items: DailyNewsItem[];
}

const OUT_FILE = path.resolve("src/data/news/daily-news.json");
const MAX_HISTORY = 30;
const TARGET_COUNT = 3;
const RECENT_WINDOW_HOURS = 36;

const NEWS_SYSTEM =
  "You are a precise IELTS coach assistant. When asked for JSON, you return strict JSON only, no markdown, no commentary.";

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

function buildPacketPrompt(seed: SelectedSeed): string {
  return `You are an IELTS reading and writing coach. Build a self-contained learning packet from a news headline + RSS summary, NOT from full article text.

News title: ${seed.title}
Source: ${seed.source}
Published at: ${seed.publishedAt}
Topic hint (from upstream classifier): ${seed.topic}
Original RSS summary (do NOT copy verbatim):
"""
${seed.originalSummary}
"""

Constraints:
- learningSummary and listeningText must be your own paraphrase, IELTS reading register, NOT a copy of the original article.
- vocabulary must be exactly 5 IELTS Band 6.5+ items.
- readingQuestions must be exactly 3, mix of detail/inference/vocab-in-context. Answers in English.
- writingPrompt must look like an IELTS Task 2 essay question.
- topic must be one of: education|technology|environment|society|health|work. Prefer the topic hint unless clearly wrong.

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

/**
 * 修复 LLM 输出中常见的 JSON 语法错误:
 *   1. 字符串字面量里的裸 \n / \r / \t (LLM 经常忘记转义)
 *   2. 数组/对象末尾多余的逗号 (... ,] 或 ... ,})
 *   3. 字符串字面量里裸的 " (前面没有 \) -> 不在本版做, 误伤太大
 */
function sanitizeJson(input: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (escape) {
      out += c;
      escape = false;
      continue;
    }
    if (c === "\\") {
      out += c;
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      out += c;
      continue;
    }
    if (inString) {
      if (c === "\n") {
        out += "\\n";
        continue;
      }
      if (c === "\r") {
        out += "\\r";
        continue;
      }
      if (c === "\t") {
        out += "\\t";
        continue;
      }
    }
    out += c;
  }
  // 去掉尾随逗号 ", ]" 或 ", }"
  out = out.replace(/,\s*([\]}])/g, "$1");
  return out;
}

function parseJsonSafe(raw: string): unknown {
  const stripped = stripJsonFence(raw);
  try {
    return JSON.parse(stripped);
  } catch (firstErr) {
    try {
      const sanitized = sanitizeJson(stripped);
      return JSON.parse(sanitized);
    } catch {
      // 抛出第一次的错误信息, 更接近原始问题
      throw firstErr;
    }
  }
}

interface AIPacket {
  topic: DailyNewsTopic;
  learningSummary: string;
  vocabulary: DailyNewsVocabItem[];
  readingQuestions: DailyNewsReadingQA[];
  writingPrompt: string;
  listeningText: string;
}

function isValidPacket(p: unknown): p is AIPacket {
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

async function callMiniMaxOnce(
  seed: SelectedSeed,
  attempt: number
): Promise<AIPacket> {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) throw new Error("no_api_key");
  const baseUrl = (process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1").replace(
    /\/+$/,
    ""
  );
  const chatPath = process.env.MINIMAX_CHAT_PATH || "/chat/completions";
  const model = process.env.MINIMAX_TEXT_MODEL || "MiniMax-M2.7";

  // 第二次重试时降一点 temperature, 收紧到更稳的输出
  const temperature = attempt === 1 ? 0.4 : 0.2;

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
        { role: "user", content: buildPacketPrompt(seed) }
      ],
      temperature,
      max_completion_tokens: 2400,
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
  const parsed = parseJsonSafe(content) as unknown;
  if (!isValidPacket(parsed)) throw new Error("invalid AI shape");
  return parsed;
}

async function callMiniMax(seed: SelectedSeed): Promise<AIPacket> {
  try {
    return await callMiniMaxOnce(seed, 1);
  } catch (e1) {
    const msg = (e1 as Error).message;
    // HTTP 4xx 立刻放弃, 不重试 (鉴权问题、payload 问题)
    if (/^HTTP 4\d\d/.test(msg) || msg === "no_api_key") throw e1;
    console.warn(`    retry once after: ${msg}`);
    return await callMiniMaxOnce(seed, 2);
  }
}

function mockPacket(seed: SelectedSeed): AIPacket {
  return {
    topic: seed.topic,
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
        answer: "(Mock) Because it affects how people learn or behave."
      },
      {
        question: "What does the writer suggest as the next step?",
        answer: "(Mock) Further evaluation before scaling up."
      }
    ],
    writingPrompt:
      "Some people think governments should fund pilot programmes that test new public ideas, while others believe such money should go directly to existing services. Discuss both views and give your own opinion.",
    listeningText: `(Mock listening passage.) ${seed.title}. This is a neutral, IELTS-style spoken paraphrase based only on the headline and the short RSS summary.`
  };
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

function getFeeds(): RssFeedSource[] {
  const fromEnv = parseFeedsFromEnv(process.env.NEWS_RSS_FEEDS);
  return fromEnv.length ? fromEnv : DEFAULT_FEEDS;
}

async function main() {
  const date = todayKey();
  const feeds = getFeeds();
  console.log(`[1/4] Fetching ${feeds.length} feeds...`);
  const { all, errors } = await fetchAllFeeds(feeds);
  if (errors.length) {
    for (const err of errors) {
      console.warn(`  feed failed: ${err.source} -> ${err.error}`);
    }
  }
  console.log(`     got ${all.length} raw items`);

  const recent = filterRecent(all, RECENT_WINDOW_HOURS * 60 * 60 * 1000);
  const deduped = dedupSeeds(recent);
  const candidates = deduped.length > 0 ? deduped : dedupSeeds(all);
  console.log(`     ${candidates.length} candidates after recent+dedup`);

  let selected: SelectedSeed[] = [];
  if (candidates.length === 0) {
    console.warn("[2/4] No candidates from RSS, falling back to mock seed.");
    const fallbackSeed: RawSeed = {
      title: "Why universities are rethinking written exams in the age of AI",
      source: "Mock IELTS Wire",
      sourceFeed: "mock",
      url: "https://example.com/news/ai-and-exams",
      publishedAt: new Date().toISOString(),
      originalSummary:
        "As generative AI tools become widespread, several universities are piloting oral defenses, in-class essays and project-based portfolios to verify what students have actually learned."
    };
    selected = [{ ...fallbackSeed, topic: "education" }];
  } else {
    console.log(`[2/4] Asking MiniMax to select ${TARGET_COUNT} items...`);
    const sel = await selectSeeds(candidates, TARGET_COUNT);
    if (!sel.aiUsed) {
      console.warn(`     AI selection skipped/failed: ${sel.reason || "unknown"}, using heuristic`);
    }
    selected = sel.selected;
    console.log(`     picked: ${selected.length} items`);
  }

  if (!selected.length) {
    console.error("Nothing to write, exiting without changing daily-news.json");
    return;
  }

  console.log(`[3/4] Generating IELTS packets for ${selected.length} items...`);
  const built: DailyNewsItem[] = [];
  for (const [idx, seed] of selected.entries()) {
    let packet: AIPacket;
    let aiSource: "minimax" | "mock" = "mock";
    try {
      packet = await callMiniMax(seed);
      aiSource = "minimax";
      console.log(`  [${idx + 1}/${selected.length}] MiniMax OK: ${seed.title}`);
    } catch (e) {
      packet = mockPacket(seed);
      console.warn(
        `  [${idx + 1}/${selected.length}] mock fallback for "${seed.title}": ${(e as Error).message}`
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

  console.log(`[4/4] Writing ${OUT_FILE}...`);
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
    `Done. ${built.length} new for ${date}, ${merged.length} total in file.`
  );
}

main().catch((e) => {
  console.error("update-daily-news failed:", e);
  process.exit(1);
});
