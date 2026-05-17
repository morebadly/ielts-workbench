/**
 * 任务 B: 把 Simon 9 分范文合集 PDF 提取成结构化范文数组。
 *
 * 输入: .tmp-pdfs/_text/雅思考官Simon写作大小作文9分范文合集.txt
 * 输出: src/data/simonEssays.json
 *
 * 范文文件结构 (人工观察):
 *   雅思写作考官范文之 <中文标题>
 *   1.题目: <粘连的英文题目>
 *   范文:
 *   <粘连的英文范文, 多段, 段间换行>
 *   (XXX words, band 9)
 *   --- 下一篇 ---
 *
 * MiniMax 任务:
 *   1) 加空格
 *   2) 切篇 (按 "雅思写作考官范文之" 标题 + "(XXX words" 收尾)
 *   3) 识别 task1 (line graph / bar chart / pie chart / table / map / process diagram) vs task2
 *   4) 提取 prompt + essay (保留段落)
 *
 * 跑法: node scripts/extract-task-b.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { chatJSON } from "./lib/minimax.mjs";

const INPUT = path.resolve(
  process.cwd(),
  ".tmp-pdfs/_text/雅思考官Simon写作大小作文9分范文合集.txt"
);
const OUT = path.resolve(process.cwd(), "src/data/simonEssays.json");

/**
 * 切分: 每个 "雅思写作考官范文之" 标题为一段, 直到下一个标题之前
 * 文件大约有 28 篇范文。MiniMax 单次塞 10 篇左右安全, 留出空间给输出。
 */
function splitByEssay(text, batchSize = 10) {
  const marker = "雅思写作考官范文之";
  const lines = text.split(/\r?\n/);
  const sections = [];
  let buf = [];
  for (const line of lines) {
    if (line.includes(marker) && buf.length > 0) {
      sections.push(buf.join("\n"));
      buf = [];
    }
    buf.push(line);
  }
  if (buf.length) sections.push(buf.join("\n"));

  // 拼成 batch
  const batches = [];
  for (let i = 0; i < sections.length; i += batchSize) {
    batches.push(sections.slice(i, i + batchSize).join("\n\n"));
  }
  return { sections, batches };
}

const PROMPT = `你将收到 IELTS 考官 Simon 写的"9 分范文合集"的一段纯文本。每一篇范文都遵循:

雅思写作考官范文之<中文标题>
1.题目:<英文题目>
范文:
<英文范文, 多段, 段间换行>
(XXX words, band 9)

由于 PDF 抽取丢了空格, 英文都粘在一起。请:
1) 把英文重新分词 (按真实英文)
2) 切出每一篇范文
3) 识别 taskType: task1 (line graph / bar chart / pie chart / table / map / process diagram, 通常题目里出现"chart"/"graph"/"table"/"map"/"diagram"/"shows"+图表词) vs task2 (议论文)
4) essay 字段必须保留段落, 段间用 "\n\n" 分隔
5) wordCount + band 从结尾 "(XXX words, band 9)" 提取

返回严格 JSON:
{
  "essays": [
    {
      "titleZh": "<中文标题, 简洁>",
      "taskType": "task1" | "task2",
      "promptText": "<英文题目>",
      "essay": "<完整英文范文, 段间 \\n\\n>",
      "wordCount": <number>,
      "band": <number, 通常 9>
    }
  ]
}

输出严格 JSON, 不要 <think> 不要 markdown 不要前后缀文字。`;

async function processBatch(batchText, idx, total) {
  console.log(`\n=== batch ${idx + 1}/${total} (${batchText.length} chars) ===`);
  const userMsg = `${PROMPT}

--- 文本开始 ---
${batchText}
--- 文本结束 ---`;
  try {
    const result = await chatJSON({ user: userMsg, maxTokens: 16000 });
    const items = Array.isArray(result.essays) ? result.essays : [];
    console.log(`  -> ${items.length} essays`);
    return items;
  } catch (e) {
    console.log(`  ERR: ${e.message}`);
    return [];
  }
}

async function main() {
  const text = await fs.readFile(INPUT, "utf-8");
  const { sections, batches } = splitByEssay(text, 8);
  console.log(`[task B] ${sections.length} sections detected, ${batches.length} batches`);

  const all = [];
  for (let i = 0; i < batches.length; i++) {
    const items = await processBatch(batches[i], i, batches.length);
    for (const it of items) all.push(it);
  }

  console.log(`\n[total essays] ${all.length}`);
  const t1 = all.filter((e) => e.taskType === "task1").length;
  const t2 = all.filter((e) => e.taskType === "task2").length;
  console.log(`task1: ${t1}, task2: ${t2}`);

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(all, null, 2), "utf-8");
  console.log(`wrote -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
