"use client";

/**
 * 浏览器端 PDF 文本提取(替代 server-side pdf-parse)。
 *
 * 为什么走客户端:
 *   - Netlify 免费版 Function 请求体 6MB 上限,中等 PDF (10-20MB) 会被网关拦下
 *   - 客户端提取后只把文本(通常 <200KB)发到 Function,绕开 body 限制
 *   - PDF 不离开用户浏览器,更隐私
 *   - Lambda 不需要打包 pdf-parse,zip size 直降
 *
 * 使用 pdfjs-dist 浏览器版,worker 走 jsdelivr CDN,避免 Next.js 静态资源打包问题。
 */

interface ExtractOptions {
  fromPage?: number;
  toPage?: number;
  /** 进度回调 (currentPage, totalPages) */
  onProgress?: (current: number, total: number) => void;
}

export interface ClientExtractResult {
  totalPages: number;
  pageRange: { from: number; to: number };
  text: string;
  textPerPage: string[];
  /** 平均每页字符 < 40 视为扫描件 */
  isProbablyScanned: boolean;
  charCountAfterTrim: number;
}

const SCANNED_THRESHOLD_CHARS_PER_PAGE = 40;

let pdfjsModule: typeof import("pdfjs-dist") | null = null;

async function loadPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (pdfjsModule) return pdfjsModule;
  // 异步加载 pdfjs-dist; 它体积较大, 不要静态 import
  const mod = await import("pdfjs-dist");
  // 4.x 版本 worker 必须显式指定。用 jsdelivr 的 ESM CDN 链接。
  const version = mod.version;
  mod.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  pdfjsModule = mod;
  return mod;
}

export async function extractPdfTextInBrowser(
  file: File,
  opts: ExtractOptions = {}
): Promise<ClientExtractResult> {
  if (typeof window === "undefined") {
    throw new Error("extractPdfTextInBrowser 只能在浏览器调用");
  }

  const pdfjs = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  // pdfjs 会把 buffer 移交到 worker, 复制一份给它
  const data = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjs.getDocument({ data, disableFontFace: true });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const fromPage = Math.max(1, opts.fromPage || 1);
  const toPage = Math.min(totalPages, opts.toPage || totalPages);

  const pages: string[] = [];
  for (let p = fromPage; p <= toPage; p++) {
    opts.onProgress?.(p - fromPage + 1, toPage - fromPage + 1);
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    type TextItem = { str: string };
    const items = (tc.items as TextItem[])
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean);
    pages.push(items.join(" "));
    page.cleanup();
  }
  pdf.cleanup();
  await pdf.destroy();

  const text = pages.join("\n\n").trim();
  const trimmedLen = text.replace(/\s+/g, "").length;
  const pageCountInRange = Math.max(1, toPage - fromPage + 1);
  const isProbablyScanned =
    trimmedLen / pageCountInRange < SCANNED_THRESHOLD_CHARS_PER_PAGE;

  return {
    totalPages,
    pageRange: { from: fromPage, to: toPage },
    text,
    textPerPage: pages,
    isProbablyScanned,
    charCountAfterTrim: trimmedLen
  };
}
