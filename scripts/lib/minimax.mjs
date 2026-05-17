/**
 * Node 脚本里的 MiniMax 调用 helper (ESM mjs, 仅本地 build-time 数据生成)。
 *
 * 跟 src/lib/ai/minimax.ts 思路一致, 重点处理:
 *   - reasoning 模型 (M2.7) 输出会带 <think>...</think> 块 (有时还没闭合)
 *   - response_format json_object 偶发被忽略, 文本带 markdown 代码块
 *   - Token Plan 限速严格, 429 自动等待重试 + 串行节流
 *
 * 用法:
 *   import { chatJSON } from "./lib/minimax.mjs";
 *   const data = await chatJSON({ user: "...", maxTokens: 16000 });
 *
 * 自动从 .env.local 读 MINIMAX_API_KEY / MINIMAX_BASE_URL / MINIMAX_TEXT_MODEL
 */
import { promises as fs } from "node:fs";
import path from "node:path";

let cachedConfig = null;

async function loadConfig() {
  if (cachedConfig) return cachedConfig;
  const envPath = path.resolve(process.cwd(), ".env.local");
  const text = await fs.readFile(envPath, "utf-8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  cachedConfig = {
    apiKey: env.MINIMAX_API_KEY,
    baseUrl: (env.MINIMAX_BASE_URL || "https://api.minimax.io/v1").replace(/\/+$/, ""),
    chatPath: env.MINIMAX_CHAT_PATH || "/chat/completions",
    textModel: env.MINIMAX_TEXT_MODEL || "MiniMax-M2.7"
  };
  if (!cachedConfig.apiKey) throw new Error(".env.local 里没 MINIMAX_API_KEY");
  return cachedConfig;
}

const SYSTEM_PROMPT =
  "You are a precise IELTS coach assistant. When asked for JSON, you return strict JSON only, no markdown, no commentary, and absolutely no <think> blocks.";

/**
 * 处理 reasoning 模型的 <think> + markdown 代码块, 提取真正 JSON 文本。
 */
function stripJsonFence(s) {
  // 1) 闭合的 <think>...</think>
  let cleaned = s.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // 2) 没闭合的 <think> ... (常见于 max_tokens 截断或者拒了 json mode)
  //    截到第一个 { 或 [ 之前的所有内容当 reasoning 丢掉
  if (cleaned.startsWith("<think>")) {
    const firstJson = cleaned.search(/[{[]/);
    if (firstJson > 0) cleaned = cleaned.slice(firstJson);
  }
  // 3) markdown 代码块
  const fenceJson = cleaned.match(/```json\s*([\s\S]*?)```/i);
  if (fenceJson) return fenceJson[1].trim();
  const fenceAny = cleaned.match(/```\s*([\s\S]*?)```/);
  if (fenceAny) {
    const inner = fenceAny[1].trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }
  if (cleaned.startsWith("{") || cleaned.startsWith("[")) return cleaned;
  // 4) 兜底: 找第一个 { 到最后一个 }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

// 串行节流: 全局上一次调用结束时间, 保证两次调用间至少 MIN_INTERVAL_MS
const MIN_INTERVAL_MS = 3500;
let lastCallEndedAt = 0;

async function throttle() {
  const now = Date.now();
  const wait = lastCallEndedAt + MIN_INTERVAL_MS - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

/**
 * 调一次 MiniMax chat, 强制 JSON 输出, 自动 429 重试 + 节流。
 *
 * @param {object} opts
 * @param {string} opts.user - user message
 * @param {string} [opts.system]
 * @param {number} [opts.maxTokens] - 默认 16000 (M2.7 reasoning 头要占一些, 留宽)
 * @param {number} [opts.temperature] - 默认 0.2
 * @param {number} [opts.maxRetries] - 默认 4
 * @returns {Promise<any>}
 */
export async function chatJSON(opts) {
  const cfg = await loadConfig();
  const url = cfg.baseUrl + cfg.chatPath;
  const body = {
    model: cfg.textModel,
    messages: [
      { role: "system", content: opts.system || SYSTEM_PROMPT },
      { role: "user", content: opts.user }
    ],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 16000,
    response_format: { type: "json_object" }
  };
  const maxRetries = opts.maxRetries ?? 4;

  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttle();
    let r;
    try {
      r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`
        },
        body: JSON.stringify(body)
      });
    } catch (e) {
      lastErr = e;
      lastCallEndedAt = Date.now();
      console.log(`  [chatJSON] network err attempt ${attempt + 1}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    if (r.status === 429) {
      lastCallEndedAt = Date.now();
      const wait = 30000 + attempt * 15000; // 30s/45s/60s/75s
      console.log(`  [chatJSON] 429 rate limited, sleeping ${wait}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!r.ok) {
      const txt = await r.text();
      lastCallEndedAt = Date.now();
      lastErr = new Error(`HTTP ${r.status}: ${txt.slice(0, 300)}`);
      // 5xx 重试, 4xx 直接抛
      if (r.status >= 500 && attempt < maxRetries) {
        console.log(`  [chatJSON] ${r.status} retrying in 5s`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw lastErr;
    }

    const j = await r.json();
    lastCallEndedAt = Date.now();
    const content = j.choices?.[0]?.message?.content;
    if (!content) {
      lastErr = new Error("MiniMax 返回空 content: " + JSON.stringify(j).slice(0, 300));
      if (attempt < maxRetries) continue;
      throw lastErr;
    }
    const cleaned = stripJsonFence(content);
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // 偶发 reasoning 模型把 JSON 截断, 重试一次
      lastErr = new Error(
        `非 JSON: ${cleaned.slice(0, 200)}... (raw start: ${content.slice(0, 100)})`
      );
      if (attempt < maxRetries) {
        console.log(`  [chatJSON] parse fail, retrying`);
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr ?? new Error("chatJSON exhausted retries");
}
