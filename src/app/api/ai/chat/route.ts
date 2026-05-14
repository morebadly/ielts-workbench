import { NextResponse } from "next/server";
import {
  MiniMaxConfigError,
  chatJSON,
  getMiniMaxConfig,
  SYSTEM_PROMPT
} from "@/lib/ai/minimax";
import { PROMPTS, type AICapability } from "@/lib/ai/prompts";

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
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || !body.capability) {
    return NextResponse.json({ error: "missing_capability" }, { status: 400 });
  }

  let userPrompt: string;
  try {
    userPrompt = buildPrompt(body);
  } catch (e) {
    return NextResponse.json(
      { error: "bad_capability", detail: (e as Error).message },
      { status: 400 }
    );
  }

  try {
    const data = await chatJSON<unknown>(SYSTEM_PROMPT, userPrompt);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    if (e instanceof MiniMaxConfigError) {
      return NextResponse.json(
        { error: "not_configured", detail: e.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "ai_failed", detail: (e as Error).message },
      { status: 502 }
    );
  }
}
