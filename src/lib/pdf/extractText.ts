import "server-only";

export interface ExtractResult {
  totalPages: number;
  pageRange: { from: number; to: number };
  text: string;
  textPerPage: string[];
  isProbablyScanned: boolean;
  charCountAfterTrim: number;
  info: Record<string, unknown>;
}

interface PdfParsePage {
  pageInfo?: { num?: number };
  text?: string;
}

interface PdfParseResult {
  numpages: number;
  text: string;
  info?: Record<string, unknown>;
  metadata?: unknown;
}

const SCANNED_THRESHOLD_CHARS_PER_PAGE = 40;

export async function extractPdfText(
  buffer: Buffer,
  opts: { fromPage?: number; toPage?: number } = {}
): Promise<ExtractResult> {
  const pdfParse = (await import("pdf-parse")).default as (
    data: Buffer,
    options?: {
      pagerender?: (pageData: unknown) => Promise<string> | string;
      max?: number;
    }
  ) => Promise<PdfParseResult>;

  const pages: string[] = [];
  let currentPageNum = 0;

  const renderPage = async (pageData: unknown): Promise<string> => {
    currentPageNum += 1;
    const pd = pageData as {
      getTextContent?: (opts: {
        normalizeWhitespace?: boolean;
        disableCombineTextItems?: boolean;
      }) => Promise<{ items: Array<{ str: string }> }>;
    };
    if (!pd.getTextContent) return "";
    const tc = await pd.getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: false
    });
    const text = tc.items.map((it) => it.str).join(" ");
    pages.push(text);
    return text;
  };

  const data = await pdfParse(buffer, { pagerender: renderPage });

  const totalPages = data.numpages || pages.length;
  const fromPage = Math.max(1, opts.fromPage || 1);
  const toPage = Math.min(totalPages, opts.toPage || totalPages);

  const slicedPages =
    pages.length > 0
      ? pages.slice(fromPage - 1, toPage)
      : [data.text || ""];

  const text = slicedPages.join("\n\n").trim();
  const trimmedLen = text.replace(/\s+/g, "").length;
  const pageCountInRange = Math.max(1, toPage - fromPage + 1);
  const isProbablyScanned =
    trimmedLen / pageCountInRange < SCANNED_THRESHOLD_CHARS_PER_PAGE;

  return {
    totalPages,
    pageRange: { from: fromPage, to: toPage },
    text,
    textPerPage: slicedPages,
    isProbablyScanned,
    charCountAfterTrim: trimmedLen,
    info: data.info || {}
  };
}
