"use client";

/**
 * 浏览器端把 PDF 每页渲染成 JPEG base64,用于送多模态 AI(图像理解)。
 *
 * 设计要点:
 *   - PDF 不离开浏览器,跟 extractTextClient.ts 共用 pdfjs-dist worker
 *   - JPEG 比 PNG 小 5-10 倍, 默认质量 0.7 平衡识别度和体积
 *   - 默认渲染分辨率 1.5x (≈ 144 DPI),足够印刷英文 + 中文识别
 *   - 单页失败不让整体崩,onProgress 抛错让 UI 可以继续
 */

interface RenderOptions {
  fromPage?: number;
  toPage?: number;
  /** 缩放系数。1.5 ≈ 144 DPI,印刷品识别足够;OCR 难识别时调到 2.0 */
  scale?: number;
  /** JPEG 质量 0-1,默认 0.7 */
  quality?: number;
  onProgress?: (current: number, total: number) => void;
}

export interface RenderedPage {
  pageNumber: number;
  /** "data:image/jpeg;base64,..." */
  dataUrl: string;
  /** 不带 data url 前缀的纯 base64 */
  base64: string;
  width: number;
  height: number;
  /** 大约字节数 */
  approxBytes: number;
}

let pdfjsModule: typeof import("pdfjs-dist") | null = null;

async function loadPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (pdfjsModule) return pdfjsModule;
  const mod = await import("pdfjs-dist");
  const version = mod.version;
  mod.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  pdfjsModule = mod;
  return mod;
}

export async function renderPdfPagesInBrowser(
  file: File,
  opts: RenderOptions = {}
): Promise<RenderedPage[]> {
  if (typeof window === "undefined") {
    throw new Error("renderPdfPagesInBrowser 只能在浏览器调用");
  }

  const scale = opts.scale ?? 1.5;
  const quality = opts.quality ?? 0.7;

  const pdfjs = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjs.getDocument({ data, disableFontFace: true });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const fromPage = Math.max(1, opts.fromPage || 1);
  const toPage = Math.min(totalPages, opts.toPage || totalPages);
  const pageCount = toPage - fromPage + 1;

  const out: RenderedPage[] = [];
  for (let p = fromPage; p <= toPage; p++) {
    opts.onProgress?.(p - fromPage + 1, pageCount);
    try {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("canvas 2d context unavailable");
      // 白底,扫描件常有透明边缘
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // pdfjs 5.x render 类型:render({ canvasContext, viewport })
      const renderTask = page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
        canvas
      } as unknown as Parameters<typeof page.render>[0]);
      await renderTask.promise;

      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
      out.push({
        pageNumber: p,
        dataUrl,
        base64,
        width: canvas.width,
        height: canvas.height,
        approxBytes: Math.round((base64.length * 3) / 4)
      });
      page.cleanup();
    } catch (e) {
      // 单页失败不中断, 标记空 page; UI 可以选择忽略或重试
      out.push({
        pageNumber: p,
        dataUrl: "",
        base64: "",
        width: 0,
        height: 0,
        approxBytes: 0
      });
      console.warn(`[renderPdfPages] page ${p} failed`, e);
    }
  }

  pdf.cleanup();
  await pdf.destroy();

  return out;
}
