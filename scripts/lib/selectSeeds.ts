/**
 * scripts/lib/selectSeeds.ts
 * 让 MiniMax 从一堆候选 RSS seed 中, 挑出 1-3 篇最适合 IELTS 学习者的, 并打 topic 标签
 */
import type { RawSeed } from "./rssFetcher";

export type DailyNewsTopic =
  | "education"
  | "technology"
  | "environment"
  | "society"
  | "health"
  | "work";

const VALID_TOPICS = new Set<DailyNewsTopic>([
  "education",
  "technology",
  "environment",
  "society",
  "health",
  "work"
]);

export interface SelectedSeed extends RawSeed {
  topic: DailyNewsTopic;
}

interface AiPick {
  index: number;
  topic: string;
  reason?: string;
}

const SYSTEM =
  "You are an experienced IELTS reading material curator. Reply with strict JSON only, no markdown.";

const MAX_CANDIDATES = 25;

function buildPrompt(seeds: RawSeed[], wantCount: number): string {
  const list = seeds
    .map(
      (s, i) =>
        `[${i}] (${s.source}) ${s.title}\nSummary: ${s.originalSummary}`
    )
    .join("\n\n");

  return `You are picking 1 to ${wantCount} news items as IELTS reading practice seeds for Chinese learners.

Selection rules (be strict):
- The topic must fit IELTS Task 2 themes: education, technology, environment, society, health, or work.
- Avoid: hard-breaking news (war, terrorism, graphic crime, celebrity gossip, sports scores, politics-only stories).
- Prefer items with general interest, neutral tone, abstract enough to discuss in essays.
- Diversify topics across the picks if possible.

Candidates:
${list}

Return STRICT JSON, no markdown:
{
  "picks": [
    { "index": <number from the candidates list>, "topic": "<one of education|technology|environment|society|health|work>", "reason": "<short English reason>" }
  ]
}
- "picks" length: between 1 and ${wantCount}.
- Use only indices that appear above.`;
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

async function callMiniMax(prompt: string): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) throw new Error("no_api_key");
  const baseUrl = (process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1").replace(
    /\/+$/,
    ""
  );
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
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_completion_tokens: 800,
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
  return content;
}

function trimToTopic(s: string): DailyNewsTopic | null {
  const v = s.toLowerCase().trim() as DailyNewsTopic;
  return VALID_TOPICS.has(v) ? v : null;
}

/**
 * 失败兜底: 不调 AI, 用启发式规则挑前 N 条
 * - 简单按 source 分散, 避免全来自一个站
 */
function heuristicPick(seeds: RawSeed[], n: number): SelectedSeed[] {
  const seenSource = new Set<string>();
  const primary: RawSeed[] = [];
  const secondary: RawSeed[] = [];
  for (const s of seeds) {
    if (!seenSource.has(s.source)) {
      seenSource.add(s.source);
      primary.push(s);
    } else {
      secondary.push(s);
    }
  }
  const ordered = [...primary, ...secondary].slice(0, n);

  return ordered.map<SelectedSeed>((s) => ({
    ...s,
    topic: guessTopicFromUrl(s.sourceFeed) || "society"
  }));
}

function guessTopicFromUrl(url: string): DailyNewsTopic | null {
  const u = url.toLowerCase();
  if (u.includes("education")) return "education";
  if (u.includes("technology") || u.includes("tech")) return "technology";
  if (u.includes("environment") || u.includes("science")) return "environment";
  if (u.includes("health")) return "health";
  if (u.includes("work") || u.includes("business")) return "work";
  return null;
}

export async function selectSeeds(
  seeds: RawSeed[],
  wantCount: number
): Promise<{ selected: SelectedSeed[]; aiUsed: boolean; reason?: string }> {
  if (!seeds.length) return { selected: [], aiUsed: false };
  const candidates = seeds.slice(0, MAX_CANDIDATES);

  if (!process.env.MINIMAX_API_KEY?.trim()) {
    return {
      selected: heuristicPick(candidates, wantCount),
      aiUsed: false,
      reason: "no_api_key"
    };
  }

  let raw: string;
  try {
    raw = await callMiniMax(buildPrompt(candidates, wantCount));
  } catch (e) {
    return {
      selected: heuristicPick(candidates, wantCount),
      aiUsed: false,
      reason: (e as Error).message
    };
  }

  let parsed: { picks?: AiPick[] };
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (e) {
    return {
      selected: heuristicPick(candidates, wantCount),
      aiUsed: false,
      reason: `parse_fail: ${(e as Error).message}`
    };
  }

  const picks = Array.isArray(parsed.picks) ? parsed.picks : [];
  const selected: SelectedSeed[] = [];
  const usedIdx = new Set<number>();
  for (const p of picks) {
    if (typeof p.index !== "number") continue;
    if (usedIdx.has(p.index)) continue;
    if (p.index < 0 || p.index >= candidates.length) continue;
    const topic = trimToTopic(p.topic) || guessTopicFromUrl(candidates[p.index].sourceFeed) || "society";
    usedIdx.add(p.index);
    selected.push({ ...candidates[p.index], topic });
    if (selected.length >= wantCount) break;
  }

  if (!selected.length) {
    return {
      selected: heuristicPick(candidates, wantCount),
      aiUsed: false,
      reason: "ai_empty_picks"
    };
  }

  return { selected, aiUsed: true };
}
