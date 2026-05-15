/**
 * scripts/lib/rssFetcher.ts
 * 拉取多个 RSS feed, 解析为统一的 RawSeed 列表
 *
 * 版权策略:
 * - 仅保留 RSS 自身公开提供的字段: title, link, pubDate, description
 * - 不抓正文页, 不二次发布原文, 仅作为「学习素材种子」喂给 AI 改写
 */
import { XMLParser } from "fast-xml-parser";

// 国内访问 BBC/Guardian 通常需要代理。用 HTTPS_PROXY / HTTP_PROXY 环境变量
// 控制。undici 是 Node 内置 fetch 的底层, 用它的 ProxyAgent 即可。
let proxyDispatcher: unknown = null;
let proxyTried = false;
async function getProxyDispatcher(): Promise<unknown> {
  if (proxyTried) return proxyDispatcher;
  proxyTried = true;
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;
  if (!proxyUrl) return null;
  try {
    // 用变量绕过 TS 的静态模块解析。undici 是 Node 18+ 内置, 类型不在 @types/node 里。
    const moduleName = "undici";
    const undici = (await import(moduleName)) as {
      ProxyAgent: new (uri: string) => unknown;
    };
    proxyDispatcher = new undici.ProxyAgent(proxyUrl);
    console.log(`[rss] using proxy: ${proxyUrl.replace(/\/\/[^@]+@/, "//***@")}`);
  } catch (e) {
    console.warn(`[rss] failed to init proxy: ${(e as Error).message}`);
  }
  return proxyDispatcher;
}

export interface RssFeedSource {
  name: string;
  url: string;
}

export interface RawSeed {
  title: string;
  source: string;
  sourceFeed: string;
  url: string;
  publishedAt: string;
  originalSummary: string;
}

export const DEFAULT_FEEDS: RssFeedSource[] = [
  {
    name: "BBC News - Education",
    url: "https://feeds.bbci.co.uk/news/education/rss.xml"
  },
  {
    name: "BBC News - Technology",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml"
  },
  {
    name: "BBC News - Science & Environment",
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"
  },
  {
    name: "BBC News - Health",
    url: "https://feeds.bbci.co.uk/news/health/rss.xml"
  },
  {
    name: "The Guardian - Education",
    url: "https://www.theguardian.com/education/rss"
  },
  {
    name: "The Guardian - Environment",
    url: "https://www.theguardian.com/environment/rss"
  }
];

const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "ielts-workbench/1.6 (+https://github.com/morebadly/ielts-workbench) RSS reader";

interface RawRssItem {
  title?: string | { "#text"?: string };
  link?: string | { "#text"?: string; "@_href"?: string };
  guid?: string | { "#text"?: string };
  pubDate?: string;
  published?: string;
  updated?: string;
  description?: string | { "#text"?: string };
  summary?: string | { "#text"?: string };
  "content:encoded"?: string;
}

function pickText(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null) {
    const obj = v as Record<string, unknown>;
    if (typeof obj["#text"] === "string") return obj["#text"];
    if (typeof obj["@_href"] === "string") return obj["@_href"];
  }
  return "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, "") + "...";
}

function parseDate(s: string | undefined): string {
  if (!s) return new Date().toISOString();
  const t = Date.parse(s);
  if (Number.isNaN(t)) return new Date().toISOString();
  return new Date(t).toISOString();
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true
});

async function fetchWithTimeout(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const dispatcher = await getProxyDispatcher();
    const init: RequestInit & { dispatcher?: unknown } = {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8"
      },
      signal: ctrl.signal
    };
    if (dispatcher) init.dispatcher = dispatcher;
    const resp = await fetch(url, init);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

export interface FetchFeedResult {
  source: RssFeedSource;
  ok: boolean;
  items: RawSeed[];
  error?: string;
}

export async function fetchFeed(source: RssFeedSource): Promise<FetchFeedResult> {
  try {
    const xml = await fetchWithTimeout(source.url);
    const parsed = parser.parse(xml) as Record<string, unknown>;
    const seeds = extractSeeds(parsed, source);
    return { source, ok: true, items: seeds };
  } catch (e) {
    return {
      source,
      ok: false,
      items: [],
      error: (e as Error).message
    };
  }
}

function extractSeeds(parsed: Record<string, unknown>, source: RssFeedSource): RawSeed[] {
  // RSS 2.0:  rss.channel.item[]
  // Atom:     feed.entry[]
  const rss = parsed.rss as { channel?: { item?: RawRssItem | RawRssItem[] } } | undefined;
  const atom = parsed.feed as { entry?: RawRssItem | RawRssItem[] } | undefined;

  let rawItems: RawRssItem[] = [];
  if (rss?.channel?.item) {
    rawItems = Array.isArray(rss.channel.item) ? rss.channel.item : [rss.channel.item];
  } else if (atom?.entry) {
    rawItems = Array.isArray(atom.entry) ? atom.entry : [atom.entry];
  }

  const seeds: RawSeed[] = [];
  for (const item of rawItems) {
    const title = stripHtml(pickText(item.title));
    if (!title) continue;
    const link = pickText(item.link) || pickText(item.guid);
    if (!link || !/^https?:\/\//i.test(link)) continue;
    const summary = stripHtml(
      pickText(item.description) || pickText(item.summary) || ""
    );
    if (summary.length < 30) continue;
    seeds.push({
      title: clamp(title, 200),
      source: source.name,
      sourceFeed: source.url,
      url: link,
      publishedAt: parseDate(item.pubDate || item.published || item.updated),
      originalSummary: clamp(summary, 600)
    });
  }
  return seeds;
}

export async function fetchAllFeeds(
  sources: RssFeedSource[]
): Promise<{ all: RawSeed[]; errors: { source: string; error: string }[] }> {
  const results = await Promise.all(sources.map((s) => fetchFeed(s)));
  const all: RawSeed[] = [];
  const errors: { source: string; error: string }[] = [];
  for (const r of results) {
    if (r.ok) {
      all.push(...r.items);
    } else {
      errors.push({ source: r.source.name, error: r.error || "unknown" });
    }
  }
  return { all, errors };
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function filterRecent(seeds: RawSeed[], windowMs = TWENTY_FOUR_HOURS): RawSeed[] {
  const now = Date.now();
  return seeds.filter((s) => {
    const t = Date.parse(s.publishedAt);
    if (Number.isNaN(t)) return false;
    return now - t <= windowMs;
  });
}

export function dedupSeeds(seeds: RawSeed[]): RawSeed[] {
  const seen = new Set<string>();
  const out: RawSeed[] = [];
  for (const s of seeds) {
    const key = s.url.split(/[?#]/)[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function parseFeedsFromEnv(envValue: string | undefined): RssFeedSource[] {
  if (!envValue || !envValue.trim()) return DEFAULT_FEEDS;
  return envValue
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, ...nameParts] = line.split("|").map((x) => x.trim());
      return {
        url,
        name: nameParts.join(" | ") || url.replace(/^https?:\/\//, "").split("/")[0]
      };
    })
    .filter((s) => /^https?:\/\//i.test(s.url));
}
