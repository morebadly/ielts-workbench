import { NextResponse } from "next/server";
import { getMiniMaxConfig, synthesizeTTS } from "@/lib/ai/minimax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(getMiniMaxConfig()),
    note: "POST { text, voice, rate } once MiniMax TTS is wired"
  });
}

export async function POST(req: Request) {
  let body: { text?: string; voice?: "uk" | "us"; rate?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.text) {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }
  const result = await synthesizeTTS({
    text: body.text,
    voice: body.voice,
    rate: body.rate
  });
  if (!result.available) {
    return NextResponse.json(
      { available: false, reason: result.reason },
      { status: 501 }
    );
  }
  return NextResponse.json({ available: true });
}
