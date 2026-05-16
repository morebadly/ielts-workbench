import "server-only";

export interface MiniMaxConfig {
  apiKey: string;
  baseUrl: string;
  chatPath: string;
  textModel: string;
  visionModel: string;
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
    visionModel: process.env.MINIMAX_VISION_MODEL || "MiniMax-Text-01",
    ttsModel: process.env.MINIMAX_TTS_MODEL || "speech-02-hd"
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** OpenAI 兼容的多模态 message content */
export type VisionContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } };

export interface VisionMessage {
  role: "system" | "user" | "assistant";
  content: string | VisionContent[];
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

/**
 * 多模态:发送多张图片 + prompt 给 vision 模型,期望返回 JSON。
 *
 * 用于「看图识词」场景:用户的 PDF 是扫描件没有文字层,我们把页面渲染成图片
 * 让 vision 模型读图直接结构化。
 *
 * v1.8.5: 走 MiniMax 国内站标准 chatcompletion_v2 端点 + M2.7 多模态。
 *   - 之前走 Coding Plan VLM (/coding_plan/vlm) 路径返 0 词, 那个端点是给"看截图问代码"用的
 *   - Token Plan 套餐里的 M2.7 自带图片理解, 走标准 messages 数组协议
 *   - 单图请求 (前端拆 batch=1), 配合 Netlify Function 26s 上限
 *   - prompt 用强约束式中文, 避免 M2.7 reasoning 模型偷懒返回空数组
 */
export async function chatVisionJSON<T>(
  systemPrompt: string,
  userText: string,
  images: Array<{ dataUrl: string; detail?: "low" | "high" | "auto" }>,
  _opts: { temperature?: number; maxTokens?: number } = {}
): Promise<T> {
  const cfg = getMiniMaxConfig();
  if (!cfg) {
    throw new MiniMaxConfigError(
      "MINIMAX_API_KEY 未配置, 请在 .env.local 设置后重启 dev server"
    );
  }
  if (!images.length) {
    throw new Error("chatVisionJSON 需要至少一张图片");
  }

  // 走 MiniMax 国内站标准的 chatcompletion_v2 端点
  // 默认 cfg.chatPath 已经是 /text/chatcompletion_v2
  const url = `${cfg.baseUrl}${cfg.chatPath}`;

  const allWords: unknown[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const userTextOne = `你正在看一张《IELTS 雅思核心词汇》扫描书的页面。第 ${i + 1}/${images.length} 页。

请仔细识别这张图中的每个英文单词条目, 包括:
- 英文单词本身 (lowercase, 除非是专有名词)
- IPA 音标 (如 /təˈmɒrəʊ/, 没标就留空)
- 中文释义 (可能多个义项, 用 ; 分隔)
- 英文例句 (如有)
- Day N / List N 标记 (如有)

如果这一页有 10 个单词, 你必须输出 10 个对象。如果只有 5 个, 输出 5 个。
只有当整张图是封面/序言/目录/纯页码时, 才返回空数组。
不要因为图片质量略差就放弃, 大胆识别能看清的部分。

返回 STRICT JSON, 不要 markdown, 不要 <think> 标签:
{
  "words": [
    {
      "word": "<lowercase>",
      "phonetic": "<IPA in /.../, empty if not visible>",
      "chineseMeaning": "<中文释义, 用 ; 分隔多义>",
      "englishDefinition": "<empty if not visible>",
      "exampleSentence": "<one English example or empty>",
      "bookDay": "<e.g. Day 1, or empty>",
      "wordList": "<e.g. List A, or empty>",
      "order": <1-based integer>
    }
  ]
}

${userText || ""}`;

    // 标准 chatcompletion_v2 请求体, content 是数组(text + image_url)
    const body = {
      model: cfg.visionModel,
      messages: [
        {
          role: "system",
          name: "MiniMax AI",
          content: systemPrompt
        },
        {
          role: "user",
          name: "User",
          content: [
            { type: "text", text: userTextOne },
            { type: "image_url", image_url: { url: img.dataUrl } }
          ]
        }
      ],
      temperature: 0.1,
      tokens_to_generate: 4096
    };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
    console.log(
      `[vision] POST ${url} model=${cfg.visionModel} page=${i + 1}/${images.length} imgBytes=${img.dataUrl.length}`
    );
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
      console.error(
        `[vision] HTTP ${resp.status} body=${text.slice(0, 800)}`
      );
      throw new Error(
        `MiniMax Vision HTTP ${resp.status} (page ${i + 1}/${images.length}): ${text.slice(0, 500)}`
      );
    }
    const rawText = await resp.text();
    console.log(
      `[vision] HTTP ${resp.status} bodyLen=${rawText.length} bodyHead=${rawText.slice(0, 600)}`
    );
    let data: OpenAIChatResp & { reply?: string };
    try {
      data = JSON.parse(rawText) as OpenAIChatResp & { reply?: string };
    } catch (e) {
      throw new Error(
        `MiniMax Vision 响应非 JSON (page ${i + 1}/${images.length}): ${(e as Error).message} | head=${rawText.slice(0, 300)}`
      );
    }
    if (data.base_resp?.status_code && data.base_resp.status_code !== 0) {
      throw new Error(
        `MiniMax Vision error ${data.base_resp.status_code} (page ${i + 1}/${images.length}): ${data.base_resp.status_msg || ""}`
      );
    }
    if (data.error?.message) {
      throw new Error(
        `MiniMax Vision error (page ${i + 1}/${images.length}): ${data.error.message}`
      );
    }

    // chatcompletion_v2 标准字段:choices[0].message.content
    // 兼容字段:reply (老版兜底)
    const content =
      data.choices?.[0]?.message?.content || data.reply || "";

    if (!content || !content.trim()) {
      const dumped = JSON.stringify(data).slice(0, 800);
      throw new Error(
        `MiniMax Vision 响应内容为空 (page ${i + 1}/${images.length}). 原始: ${dumped}`
      );
    }

    const cleaned = stripJsonFence(content);
    try {
      const parsed = JSON.parse(cleaned) as { words?: unknown[] };
      if (Array.isArray(parsed.words)) {
        console.log(
          `[vision] page ${i + 1} parsed words=${parsed.words.length}`
        );
        allWords.push(...parsed.words);
      } else {
        console.warn(
          `[vision] page ${i + 1} parsed but no .words array, keys=${Object.keys(parsed).join(",")}`
        );
      }
    } catch (e) {
      console.warn(
        `[vision] page ${i + 1} JSON parse failed: ${(e as Error).message} | content head=${content.slice(0, 300)}`
      );
      continue;
    }
  }

  return JSON.parse(JSON.stringify({ words: allWords })) as T;
}

export function stripJsonFence(s: string): string {
  // 先剥离 reasoning model 漏出来的 <think>...</think> 块,避免污染 JSON 解析
  const noThink = s.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const trimmed = noThink;
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
  pitch?: number;
}

export interface TTSResult {
  audioBuffer: ArrayBuffer;
  mimeType: string;
  voiceId: string;
  format: string;
}

/**
 * 把语音偏好(uk/us)映射到 MiniMax T2A v2 的 voice_id。
 *
 * MiniMax 系统音色名常见的有:
 *   - "English_TrustworthyMan"    (US, 标准男声)
 *   - "English_GentleVoice"       (US/female, 温和)
 *   - "English_ManWithDeepVoice"  (UK, 深沉)
 *   - "English_UpsetGirl"
 *
 * 你可以通过 MINIMAX_TTS_VOICE_UK / MINIMAX_TTS_VOICE_US 环境变量覆盖。
 */
function pickVoiceId(voice: "uk" | "us"): string {
  if (voice === "uk") {
    return process.env.MINIMAX_TTS_VOICE_UK || "English_ManWithDeepVoice";
  }
  return process.env.MINIMAX_TTS_VOICE_US || "English_TrustworthyMan";
}

const TTS_TIMEOUT_MS = 60_000;

interface MiniMaxT2AResp {
  data?: {
    audio?: string; // hex 编码 mp3
  };
  base_resp?: { status_code?: number; status_msg?: string };
}

function hexToBuffer(hex: string): ArrayBuffer {
  // MiniMax 返回的 hex 字符串里可能没有空格也可能有
  const clean = hex.replace(/\s+/g, "");
  if (clean.length % 2 !== 0) {
    throw new Error("MiniMax TTS 返回的 hex 长度异常");
  }
  const buf = new Uint8Array(clean.length / 2);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return buf.buffer;
}

export async function synthesizeTTS(opts: TTSOptions): Promise<TTSResult> {
  const cfg = getMiniMaxConfig();
  if (!cfg) {
    throw new MiniMaxConfigError("MINIMAX_API_KEY 未配置, 无法使用云端 TTS");
  }
  const text = opts.text?.trim();
  if (!text) {
    throw new Error("TTS 文本为空");
  }

  const groupId = process.env.MINIMAX_GROUP_ID?.trim();
  // T2A v2 endpoint: 国内站走 minimaxi.com, 国际站走 minimax.io
  // path 默认 /t2a_v2, 通过 MINIMAX_TTS_PATH 覆盖
  const ttsPath = (process.env.MINIMAX_TTS_PATH || "/t2a_v2").replace(/^\/+/, "/");
  const url = groupId
    ? `${cfg.baseUrl}${ttsPath}?GroupId=${encodeURIComponent(groupId)}`
    : `${cfg.baseUrl}${ttsPath}`;

  const voiceId = pickVoiceId(opts.voice ?? "us");
  const rate = opts.rate ?? 1;
  const pitch = opts.pitch ?? 0;

  const body = {
    model: cfg.ttsModel,
    text,
    stream: false,
    voice_setting: {
      voice_id: voiceId,
      speed: Math.max(0.5, Math.min(2, rate)),
      vol: 1,
      pitch: Math.max(-12, Math.min(12, pitch))
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate: 128000,
      format: "mp3",
      channel: 1
    }
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TTS_TIMEOUT_MS);
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
    const errText = await resp.text().catch(() => "");
    throw new Error(`MiniMax TTS HTTP ${resp.status}: ${errText.slice(0, 300)}`);
  }
  const data = (await resp.json()) as MiniMaxT2AResp;
  if (data.base_resp?.status_code && data.base_resp.status_code !== 0) {
    throw new Error(
      `MiniMax TTS 业务错误 ${data.base_resp.status_code}: ${data.base_resp.status_msg ?? ""}`
    );
  }
  const hex = data.data?.audio;
  if (!hex) {
    throw new Error("MiniMax TTS 未返回音频数据");
  }
  return {
    audioBuffer: hexToBuffer(hex),
    mimeType: "audio/mpeg",
    voiceId,
    format: "mp3"
  };
}

export const SYSTEM_PROMPT =
  "You are a precise IELTS coach assistant. When asked for JSON, you return strict JSON only, no markdown, no commentary.";
