/**
 * 把 .tmp-pdfs/*.pdf 全部解析成纯文本, 落到 .tmp-pdfs/_text/<basename>.txt。
 * 后续脚本基于这些 .txt 做 LLM 结构化, 不再重读 PDF 这一步。
 *
 * 跑法: node scripts/pdf-to-text.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const ROOT = path.resolve(process.cwd(), ".tmp-pdfs");
const OUT = path.join(ROOT, "_text");

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const files = (await fs.readdir(ROOT)).filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`[pdf-to-text] found ${files.length} PDFs`);
  for (const name of files) {
    const src = path.join(ROOT, name);
    const dst = path.join(OUT, name.replace(/\.pdf$/i, ".txt"));
    const buf = await fs.readFile(src);
    try {
      const result = await pdfParse(buf);
      await fs.writeFile(dst, result.text, "utf-8");
      console.log(`  ok  ${name}  -> ${result.numpages}p, ${result.text.length} chars`);
    } catch (e) {
      console.log(`  ERR ${name}  ${e.message}`);
    }
  }
  console.log(`[pdf-to-text] all done -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
