/**
 * 任务 C: 把"阅读考点词 538" + "听力高频词"两份 PDF 转成站内词书 JSON。
 *
 * v2 改进:
 * - 增量落盘到 .tmp-pdfs/_progress/<module>.json, 中途断电/打断不丢
 * - 启动时自动 resume, 已抽完的 chunk 不重跑 (节省 LLM 额度)
 * - listening / reading chunk 缩小, 避开 token 截断导致的 parse fail
 *
 * 输入:
 *   .tmp-pdfs/_text/阅读考点词真经538.txt
 *   .tmp-pdfs/_text/建议打印出来的雅思听力高频词.txt
 *
 * 输出:
 *   src/data/seedBooks/reading538.json   { metadata, words[] }
 *   src/data/seedBooks/listening.json    { metadata, words[] }
 *
 * 跑法:
 *   node scripts/extract-task-c.mjs           # 默认走 resume
 *   node scripts/extract-task-c.mjs --fresh   # 忽略 progress, 从头跑
 *   node scripts/extract-task-c.mjs --module=reading   # 只跑阅读
 *   node scripts/extract-task-c.mjs --module=listening # 只跑听力
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { chatJSON } from "./lib/minimax.mjs";

const TXT_DIR = path.resolve(process.cwd(), ".tmp-pdfs/_text");
const OUT_DIR = path.resolve(process.cwd(), "src/data/seedBooks");
const PROGRESS_DIR = path.resolve(process.cwd(), ".tmp-pdfs/_progress");

const argv = process.argv.slice(2);
const FRESH = argv.includes("--fresh");
const MODULE_FILTER = (() => {
  const arg = argv.find((a) => a.startsWith("--module="));
  if (!arg) return null;
  return arg.split("=")[1];
})();

function chunkText(text, maxChars = 3000) {
  const lines = text.split(/\r?\n/);
  const chunks = [];
  let buf = [];
  let bufLen = 0;
  for (const line of lines) {
    if (bufLen + line.length > maxChars && buf.length > 0) {
      chunks.push(buf.join("\n"));
      buf = [];
      bufLen = 0;
    }
    buf.push(line);
    bufLen += line.length + 1;
  }
  if (buf.length) chunks.push(buf.join("\n"));
  return chunks;
}

async function loadProgress(module) {
  const fp = path.join(PROGRESS_DIR, `${module}.json`);
  try {
    const raw = await fs.readFile(fp, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { doneChunks: [], words: [] };
  }
}

async function saveProgress(module, progress) {
  await fs.mkdir(PROGRESS_DIR, { recursive: true });
  const fp = path.join(PROGRESS_DIR, `${module}.json`);
  await fs.writeFile(fp, JSON.stringify(progress, null, 2), "utf-8");
}

async function processModule({ module, txtFile, prompt, chunkChars, outFile, outMeta }) {
  console.log(`\n=== ${module} ===`);
  const fp = path.join(TXT_DIR, txtFile);
  const text = await fs.readFile(fp, "utf-8");
  console.log(`  ${text.length} chars`);

  const chunks = chunkText(text, chunkChars);
  console.log(`  ${chunks.length} chunks (chunkChars=${chunkChars})`);

  const progress = FRESH ? { doneChunks: [], words: [] } : await loadProgress(module);
  if (progress.doneChunks.length > 0) {
    console.log(`  resume: 已完成 ${progress.doneChunks.length} chunks, ${progress.words.length} words`);
  }

  for (let i = 0; i < chunks.length; i++) {
    if (progress.doneChunks.includes(i)) {
      console.log(`  chunk ${i + 1}/${chunks.length} skipped (resume)`);
      continue;
    }
    console.log(`  chunk ${i + 1}/${chunks.length}...`);
    const userMsg = `${prompt}

--- 文本开始 ---
${chunks[i]}
--- 文本结束 ---`;
    try {
      const result = await chatJSON({ user: userMsg, maxTokens: 16000 });
      const items = Array.isArray(result.words) ? result.words : [];
      console.log(`    -> ${items.length} words`);
      for (const it of items) progress.words.push(it);
      progress.doneChunks.push(i);
      await saveProgress(module, progress);
    } catch (e) {
      console.log(`    ERR (chunk ${i + 1} 暂未标记完成, 下次 resume 会重试): ${e.message}`);
    }
  }

  const seen = new Map();
  const deduped = [];
  for (const w of progress.words) {
    const key = `${(w.word || "").toLowerCase()}|${(w.chineseMeaning || "").slice(0, 20)}`;
    if (seen.has(key)) continue;
    seen.set(key, true);
    deduped.push(w);
  }
  console.log(`  total ${progress.words.length} -> dedupe ${deduped.length}`);

  await fs.mkdir(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, outFile);
  await fs.writeFile(
    out,
    JSON.stringify({ ...outMeta, words: deduped }, null, 2),
    "utf-8"
  );
  console.log(`  wrote -> ${out}`);

  const completed = progress.doneChunks.length === chunks.length;
  console.log(`  ${completed ? "✓ 全部 chunks 跑完" : `还剩 ${chunks.length - progress.doneChunks.length} chunks 未完成 (再跑一次脚本会续跑)`}`);
  return { completed, total: deduped.length };
}

const READING_PROMPT = `你将收到一份 IELTS 雅思阅读"考点词真经 538"的文本。文本由表格转 PDF 再 OCR/抽取得到, 排版混乱, 但每条词的结构是:

<编号> <英文词或短语>
<中文释义, 通常以 v./n./adj./adv. 开头>
<同义替换词, 多个英文单词逗号分隔>

例如:
1 resemble
v.像，与......相似
like, look, like, be similar to

请把整本词条解析为结构化数组返回。

返回严格 JSON:
{
  "words": [
    {
      "word": "resemble",
      "phonetic": null,
      "partOfSpeech": "v.",
      "chineseMeaning": "v. 像, 与...相似",
      "synonyms": ["like", "look like", "be similar to"],
      "dayHint": 1
    }
  ]
}

规则:
- partOfSpeech 用缩写带点 (v. n. adj. adv. prep. conj. phr.), 多个用逗号分隔: "v., n."
- chineseMeaning 必须以同样词性前缀开头, 整理空格/全角符号, 多个释义用 "; " 分号分隔
- synonyms 是英文同义替换词数组, 没有就 []
- dayHint:
  - 第1类考点词 (resemble 等共 54 个) -> dayHint: 1 (重要性最高)
  - 第2类 -> 2
  - 第3类 -> 3
- 短语保留, 不要拆成单词 (如 "rely on")
- 跳过表头/章节说明文字
- 输出严格 JSON, 不要 <think> 不要 markdown`;

const LISTENING_PROMPT = `你将收到一份 IELTS 雅思"听力高频词"的文本。它按场景 (Section 1-4) 分类, 每个场景有一组英中对照词。

文本结构示例:
1-11
House-Renting (租房)
landlord/landlady (女) 房东
tenant 房客
...

请按"英文词条 -> 中文释义"对应整理, 同时记录所属场景 (topic 字段)。

返回严格 JSON:
{
  "words": [
    {
      "word": "landlord",
      "phonetic": null,
      "partOfSpeech": "n.",
      "chineseMeaning": "n. 房东",
      "synonyms": [],
      "topic": "House-Renting / 租房",
      "dayHint": 1
    }
  ]
}

规则:
- 一个英文条目一行, 跟在它后面 1-3 行的中文是它的释义。
- 多个英文同义词用 / 分隔时 (如 "landlord/landlady"), 拆成多条
- 短语保留
- partOfSpeech 缩写带点 (n. v. adj. phr.), 不确定就用 n.
- chineseMeaning 必须以词性前缀开头
- topic 用 "<英文场景> / <中文翻译>" 形式
- dayHint 用场景出现顺序: 第 1 个场景 dayHint:1, 第 2 个 dayHint:2 ...
- 跳过纯标题/章节号/IPA 音标行
- 输出严格 JSON, 不要 <think> 不要 markdown`;

async function main() {
  const tasks = [];
  if (!MODULE_FILTER || MODULE_FILTER === "reading") {
    tasks.push({
      module: "reading",
      txtFile: "阅读考点词真经538.txt",
      prompt: READING_PROMPT,
      chunkChars: 2800,
      outFile: "reading538.json",
      outMeta: {
        bookId: "seed-reading-538",
        bookName: "雅思阅读考点词 538",
        bookSubtitle: "刘洪波《剑桥雅思阅读考点词真经》, 按重要性分 3 类",
        source: "阅读考点词真经 538.pdf"
      }
    });
  }
  if (!MODULE_FILTER || MODULE_FILTER === "listening") {
    tasks.push({
      module: "listening",
      txtFile: "建议打印出来的雅思听力高频词.txt",
      prompt: LISTENING_PROMPT,
      chunkChars: 3000,
      outFile: "listening.json",
      outMeta: {
        bookId: "seed-listening-hf",
        bookName: "雅思听力高频词 (按场景)",
        bookSubtitle: "Section 1-4 场景词汇汇编",
        source: "建议打印出来的雅思听力高频词.pdf"
      }
    });
  }

  const summary = [];
  for (const t of tasks) {
    const r = await processModule(t);
    summary.push({ module: t.module, ...r });
  }

  console.log("\n[task C] all done");
  for (const s of summary) {
    console.log(`  ${s.module}: ${s.completed ? "✓" : "未完成"} ${s.total} words`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
