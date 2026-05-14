import "server-only";

export interface MiniMaxConfig {
  apiKey: string;
  baseUrl: string;
  chatPath: string;
  textModel: string;
  ttsModel: string;
}

export class MiniMaxConfigError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "MiniMaxConfigError";
  }
}

export function getMiniMaxConfig(): MiniMaxConfig | null {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = (process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1").replace(
    /\/+$/,
    ""
  );
  const chatPath = (process.env.MINIMAX_CHAT_PATH || "/chat/completions").replace(
    /^\/+/,
    "/"
  );
  return {
    apiKey,
    baseUrl,
    chatPath,
    textModel: process.env.MINIMAX_TEXT_MODEL || "MiniMax-M2.7",
    ttsModel: process.env.MINIMAX_TTS_MODEL || "speech-02-hd"
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  expectJson?: boolean;
}

interface OpenAIChatResp {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  error?: { message?: string; type?: string; code?: string };
  base_resp?: { status_code?: number; status_msg?: string };
}

const DEFAULT_TIMEOUT_MS = 45_000;

export async function chatComplete(opts: ChatOptions): Promise<string> {
  const cfg = getMiniMaxConfig();
  if (!cfg) {
    throw new MiniMaxConfigError(
      "MINIMAX_API_KEY 未配置, 请在 .env.local 设置后重启 dev server"
    );
  }

  const url = `${cfg.baseUrl}${cfg.chatPath}`;
  const body: Record<string, unknown> = {
    model: cfg.textModel,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_completion_tokens: opts.maxTokens ?? 1200
  };
  if (opts.expectJson) {
    body.response_format = { type: "json_object" };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`MiniMax HTTP ${resp.status}: ${text.slice(0, 500)}`);
  }

  const data = (await resp.json()) as OpenAIChatResp;

  if (data.error?.message) {
    throw new Error(
      `MiniMax error ${data.error.code || data.error.type || ""}: ${data.error.message}`.trim()
    );
  }
  if (data.base_resp && data.base_resp.status_code && data.base_resp.status_code !== 0) {
    throw new Error(
      `MiniMax error ${data.base_resp.status_code}: ${data.base_resp.status_msg || "unknown"}`
    );
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error("MiniMax 返回内容为空");
  }
  return content;
}

export async function chatJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<T> {
  const raw = await chatComplete({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: opts.temperature ?? 0.3,
    maxTokens: opts.maxTokens ?? 1400,
    expectJson: true
  });
  const cleaned = stripJsonFence(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    throw new Error(
      `MiniMax JSON 解析失败: ${(e as Error).message} | raw: ${raw.slice(0, 300)}`
    );
  }
}

export function stripJsonFence(s: string): string {
  const trimmed = s.trim();
  const fenceJson = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fenceJson) return fenceJson[1].trim();
  const fenceAny = trimmed.match(/```\s*([\s\S]*?)```/);
  if (fenceAny) {
    const inner = fenceAny[1].trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export interface TTSOptions {
  text: string;
  voice?: "uk" | "us";
  rate?: number;
}

export async function synthesizeTTS(_opts: TTSOptions): Promise<{
  available: false;
  reason: string;
}> {
  return {
    available: false,
    reason:
      "MiniMax TTS 接口已预留, 当前仍使用浏览器 Web Speech API. 后续在此函数内调用 t2a 即可"
  };
}

export const SYSTEM_PROMPT =
  "You are a precise IELTS coach assistant. When asked for JSON, you return strict JSON only, no markdown, no commentary.";
