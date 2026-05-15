import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf/extractText";
import {
  structureWordsFromText,
  structureWordsFromImages
} from "@/lib/ai/structureWords";
import { recognizePages } from "@/lib/ocr/recognize";
import { MiniMaxConfigError } from "@/lib/ai/minimax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface VisionRequestBody {
  action: "vision";
  bookTitle?: string;
  hint?: string;
  /** data:image/jpeg;base64,... 数组,客户端渲染好的 PDF 页面图 */
  images?: string[];
}

export async function POST(req: Request) {
  let ct: string;
  try {
    ct = req.headers.get("content-type") || "";
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // ============ vision 分支:application/json,客户端发已渲染好的图 ============
  if (ct.includes("application/json")) {
    let body: VisionRequestBody;
    try {
      body = (await req.json()) as VisionRequestBody;
    } catch {
      return NextResponse.json({ error: "bad_json" }, { status: 400 });
    }
    if (body.action !== "vision") {
      return NextResponse.json(
        { error: "unsupported_json_action" },
        { status: 400 }
      );
    }
    const images = Array.isArray(body.images) ? body.images : [];
    if (!images.length) {
      return NextResponse.json(
        { error: "missing_images", detail: "请至少提供一张图片" },
        { status: 400 }
      );
    }
    if (images.length > 6) {
      return NextResponse.json(
        {
          error: "too_many_images",
          detail: "单次请求最多 6 张图,请减小批次大小"
        },
        { status: 413 }
      );
    }
    try {
      const result = await structureWordsFromImages(
        images,
        (body.bookTitle || "自定义词书").trim(),
        body.hint
      );
      return NextResponse.json({
        ok: true,
        action: "vision",
        words: result.words
      });
    } catch (e) {
      if (e instanceof MiniMaxConfigError) {
        return NextResponse.json(
          { error: "minimax_not_configured", detail: e.message },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "vision_failed", detail: (e as Error).message },
        { status: 502 }
      );
    }
  }

  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "expected_multipart" },
      { status: 400 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const fromPage = parseInt(String(form.get("fromPage") || "1"), 10) || 1;
  const toPageRaw = form.get("toPage");
  const toPage = toPageRaw ? parseInt(String(toPageRaw), 10) : undefined;
  const bookTitle = String(form.get("bookTitle") || "自定义词书").trim();
  const hint = String(form.get("hint") || "").trim() || undefined;
  const action = String(form.get("action") || "extract") as
    | "extract"
    | "structure"
    | "ocr-mock";
  const ocrText = String(form.get("ocrText") || "");

  if (action !== "structure" && !(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  try {
    if (action === "extract") {
      const f = file as File;
      if (f.size > 30 * 1024 * 1024) {
        return NextResponse.json(
          { error: "file_too_large", detail: "PDF 不能超过 30MB" },
          { status: 413 }
        );
      }
      const buf = Buffer.from(await f.arrayBuffer());
      const result = await extractPdfText(buf, { fromPage, toPage });
      return NextResponse.json({
        ok: true,
        action: "extract",
        totalPages: result.totalPages,
        pageRange: result.pageRange,
        text: result.text,
        textPerPage: result.textPerPage,
        isProbablyScanned: result.isProbablyScanned,
        charCount: result.charCountAfterTrim
      });
    }

    if (action === "ocr-mock") {
      const r = await recognizePages([], "mock");
      return NextResponse.json({
        ok: true,
        action: "ocr-mock",
        available: r.available,
        text: r.text,
        reason: r.reason
      });
    }

    if (action === "structure") {
      const text = ocrText.trim();
      if (!text) {
        return NextResponse.json(
          { error: "missing_text", detail: "请先提供要结构化的文字" },
          { status: 400 }
        );
      }
      const { words, chunks, corrections } = await structureWordsFromText(
        text,
        bookTitle,
        { hint }
      );
      return NextResponse.json({
        ok: true,
        action: "structure",
        chunks,
        words,
        corrections
      });
    }

    return NextResponse.json({ error: "bad_action" }, { status: 400 });
  } catch (e) {
    if (e instanceof MiniMaxConfigError) {
      return NextResponse.json(
        { error: "ai_not_configured", detail: e.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "import_failed", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
