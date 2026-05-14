import "server-only";

export interface RenderedPage {
  pageNumber: number;
  width: number;
  height: number;
  imageBase64: string;
  mimeType: "image/png" | "image/jpeg";
}

export interface RenderOptions {
  fromPage: number;
  toPage: number;
  dpi?: number;
}

export class RenderNotImplementedError extends Error {
  constructor() {
    super(
      "PDF 转图片暂未实现。第一版仅支持文字层 PDF。需要 OCR 时,请安装 pdfjs-dist + canvas 或使用 ImageMagick / poppler-utils 后接通此函数。"
    );
    this.name = "RenderNotImplementedError";
  }
}

export async function renderPdfPages(
  _buffer: Buffer,
  _opts: RenderOptions
): Promise<RenderedPage[]> {
  throw new RenderNotImplementedError();
}

export const RENDER_AVAILABLE = false;
