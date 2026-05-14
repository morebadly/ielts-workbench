import "server-only";
import type { RenderedPage } from "@/lib/pdf/renderPages";

export interface OCRPageResult {
  pageNumber: number;
  text: string;
  confidence?: number;
}

export interface OCRResult {
  available: boolean;
  pages: OCRPageResult[];
  text: string;
  reason?: string;
}

export type OCRBackend = "mock" | "tesseract" | "minimax-vision";

export async function recognizePages(
  pages: RenderedPage[],
  backend: OCRBackend = "mock"
): Promise<OCRResult> {
  if (backend === "mock") {
    const mockPages: OCRPageResult[] = pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: `[mock OCR for page ${p.pageNumber}] OCR backend 还没接,这里是占位。后续可在 lib/ocr/recognize.ts 接入 Tesseract 或 MiniMax Vision。`,
      confidence: 0
    }));
    return {
      available: false,
      pages: mockPages,
      text: mockPages.map((p) => p.text).join("\n\n"),
      reason: "OCR backend 未接入"
    };
  }
  return {
    available: false,
    pages: [],
    text: "",
    reason: `OCR backend "${backend}" 暂未实现`
  };
}
