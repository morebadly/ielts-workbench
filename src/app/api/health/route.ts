import { NextResponse } from "next/server";
import { getMiniMaxConfig } from "@/lib/ai/minimax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthInfo {
  ok: true;
  service: "ielts-workbench";
  version: string;
  timestamp: string;
  env: {
    minimaxConfigured: boolean;
    supabaseConfigured: boolean;
    vercel: boolean;
  };
}

export async function GET() {
  const info: HealthInfo = {
    ok: true,
    service: "ielts-workbench",
    version: process.env.npm_package_version || "1.8.1",
    timestamp: new Date().toISOString(),
    env: {
      minimaxConfigured: Boolean(getMiniMaxConfig()),
      supabaseConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
      vercel: Boolean(process.env.VERCEL)
    }
  };
  return NextResponse.json(info, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
