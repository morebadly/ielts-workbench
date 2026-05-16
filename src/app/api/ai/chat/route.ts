import { NextResponse } from "next/server";
import {
  MiniMaxConfigError,
  chatJSON,
  getMiniMaxConfig,
  SYSTEM_PROMPT
} from "@/lib/ai/minimax";
import { PROMPTS, type AICapability } from "@/lib/ai/prompts";
import {
  AISchemaError,
  isAICapability,
  validateAIResult
} from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  capability: AICapability;
  payload: Record<string, unknown>;
}

function buildPrompt(body: RequestBody): string {
  const p = body.payload;
  switch (body.capability) {
    case "pronunciation":
      return PROMPTS.pronunciation(
        String(p.word ?? ""),
        String(p.phonetic ?? ""),
        String(p.exampleSentence ?? "")
      );
    case "sentenceFeedback":
      return PROMPTS.sentenceFeedback(
        String(p.word ?? ""),
        String(p.userSentence ?? "")
      );
    case "dictationFeedback":
      return PROMPTS.dictationFeedback(
        String(p.expected ?? ""),
        String(p.got ?? ""),
        (p.kind as "word" | "sentence") || "word"
      );
    case "vocabArticle":
      return PROMPTS.vocabArticle(
        Array.isArray(p.words)
          ? (p.words as Array<{ word: string; chineseMeaning: string }>)
          : []
      );
    case "generateExample":
      return PROMPTS.generateExample(
        String(p.word ?? ""),
        String(p.chineseMeaning ?? ""),
        String(p.phonetic ?? "")
      );
    case "writingTask1":
      return PROMPTS.writingTask1(String(p.promptText ?? ""), String(p.essay ?? ""));
    case "writingTask2":
      return PROMPTS.writingTask2(String(p.promptText ?? ""), String(p.essay ?? ""));
    default:
      throw new Error(`Unknown capability: ${(body as { capability: string }).capability}`);
  }
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(getMiniMaxConfig()),
    note: "POST { capability, payload } to call MiniMax"
  });
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request", detail: "请求体不是合法 JSON" },
      { status: 400 }
    );
  }
  if (!body || !body.capability) {
    return NextResponse.json(
      { ok: false, error: "bad_request", detail: "missing capability" },
      { status: 400 }
    );
  }

  if (!isAICapability(body.capability)) {
    return NextResponse.json(
      {
        ok: false,
        error: "bad_request",
        detail: `unsupported capability: ${body.capability}`
      },
      { status: 400 }
    );
  }

  let userPrompt: string;
  try {
    userPrompt = buildPrompt(body);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "bad_request", detail: (e as Error).message },
      { status: 400 }
    );
  }

  let raw: unknown;
  try {
    raw = await chatJSON<unknown>(SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    if (e instanceof MiniMaxConfigError) {
      return NextResponse.json(
        {
          ok: false,
          error: "not_configured",
          detail: e.message,
          source: "mock"
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "ai_failed",
        detail: (e as Error).message,
        source: "mock"
      },
      { status: 502 }
    );
  }

  try {
    const validated = validateAIResult(body.capability, raw);
    return NextResponse.json({
      ok: true,
      data: validated,
      source: "minimax"
    });
  } catch (e) {
    const msg = e instanceof AISchemaError ? e.message : (e as Error).message;
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_ai_schema",
        detail: msg,
        source: "mock"
      },
      { status: 502 }
    );
  }
}
