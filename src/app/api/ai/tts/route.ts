import { NextResponse } from "next/server";
import {
  getMiniMaxConfig,
  synthesizeTTS,
  MiniMaxConfigError
} from "@/lib/ai/minimax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 1500;

interface ReqBody {
  text?: unknown;
  voice?: unknown;
  rate?: unknown;
  pitch?: unknown;
}

function bad(status: number, code: string, reason: string) {
  return NextResponse.json({ ok: false, error: code, reason }, { status });
}

export async function POST(req: Request) {
  if (!getMiniMaxConfig()) {
    return bad(503, "not_configured", "MINIMAX_API_KEY 未配置, 服务端无法合成语音");
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return bad(400, "bad_request", "请求体必须是 JSON");
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return bad(400, "bad_request", "text 必填");
  if (text.length > MAX_TEXT) {
    return bad(400, "text_too_long", `text 长度不能超过 ${MAX_TEXT}`);
  }
  const voice = body.voice === "uk" ? "uk" : "us";
  const rate = typeof body.rate === "number" ? body.rate : 1;
  const pitch = typeof body.pitch === "number" ? body.pitch : 0;

  try {
    const result = await synthesizeTTS({ text, voice, rate, pitch });
    return new NextResponse(result.audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Cache-Control": "private, max-age=600",
        "X-TTS-Voice": result.voiceId,
        "X-TTS-Format": result.format
      }
    });
  } catch (e) {
    if (e instanceof MiniMaxConfigError) {
      return bad(503, "not_configured", e.message);
    }
    const msg = (e as Error).message;
    return bad(502, "tts_failed", msg);
  }
}
