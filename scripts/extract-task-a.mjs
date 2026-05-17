/**
 * 任务 A: 把多份"雅思大作文真题"PDF 提取成结构化 prompts 数组。
 *
 * 输入: .tmp-pdfs/_text/ 下的:
 *   - 2015~2020 年雅思大作文总结.txt
 *   - 2020/2021 年全年雅思 (写作) 真题.txt
 *
 * 输出: src/data/realWritingPrompts.json (含 task1+task2 题目, 自动去重, 按日期排)
 *
 * 策略 (选项 3):
 *   - 每个文件 (~7-10K 字符) 整本一次喂给 MiniMax, max_tokens=16000
 *   - 调用次数 = 文件数 (8 次), 不再切 chunk, 大幅减少 429 概率
 *   - mjs helper 已自带串行节流 + 429 重试
 *
 * 跑法: node scripts/extract-task-a.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { chatJSON } from "./lib/minimax.mjs";

const TXT_DIR = path.resolve(process.cwd(), ".tmp-pdfs/_text");
const OUT = path.resolve(process.cwd(), "src/data/realWritingPrompts.json");

// 这些文件里的题目都是大作文(task2)
const TASK2_FILES = [
  "2015年雅思大作文总结.txt",
  "2016年雅思大作文总结.txt",
  "2017年雅思大作文总结.txt",
  "2018年雅思大作文总结.txt",
  "2019年雅思大作文总结.txt",
  "2020年雅思大作文总结.txt",
  "2021年全年雅思写作真题集.txt"
];

// 含 task1 + task2
const MIXED_FILES = ["2020年全年雅思作文真题.txt"];

const PROMPT_TASK2 = `你将收到一份 IELTS 雅思 Task 2 大作文真题集的纯文本, 由于 PDF 抽取丢失了空格, 英文单词会粘连。

请完成两件事:
1) 把粘连的英文重新分词 (按真实英文单词切, 你应该认识所有 IELTS 词汇)
2) 找出每一道大作文(Task 2)题目, 输出结构化数组

题目通常以日期开头 (如 "2021.1.9" / "2021/1/9" / "20210109"), 后面跟英文题干, 题干结尾常见短语:
"To what extent do you agree or disagree?", "Discuss both views and give your own opinion.", 
"What are the reasons / causes / solutions?", "Is this a positive or negative development?"

返回严格 JSON, 格式:
{
  "prompts": [
    {
      "date": "2021-01-09",
      "promptText": "<完整恢复空格的英文题干, 单一行, 不要换行>",
      "category": "Discussion | Opinion | CauseSolution | PositiveNegative | TwoPartQuestion | Other"
    }
  ]
}

规则:
- promptText 必须是流畅的英文, 单词间有空格, 标点正确
- 只提取 Task 2 大作文; 小作文 (line graph / bar chart / pie chart / table / process / map) 一律跳过
- 同一道题不同日期出现 -> 都保留, 但完全一致的合并成一条
- 忽略"羊驼雅思"页码水印
- 输出严格 JSON, 不要 <think> 不要 markdown 不要任何前后缀文字`;

const PROMPT_MIXED = `你将收到一份 IELTS 雅思作文真题的纯文本, 由于 PDF 抽取丢失了空格, 英文单词会粘连。

请完成两件事:
1) 把粘连的英文重新分词
2) 找出每一道作文题, 区分 Task 1 (小作文, 描述图表/流程/地图) 和 Task 2 (大作文)

返回严格 JSON, 格式:
{
  "prompts": [
    {
      "taskType": "task1" | "task2",
      "date": "YYYY-MM-DD",
      "promptText": "<恢复空格的英文题干>",
      "chartType": "line" | "bar" | "pie" | "table" | "process" | "map" | "mixed" | null,
      "category": "Discussion" | "Opinion" | "CauseSolution" | "PositiveNegative" | "TwoPartQuestion" | "Other" | null
    }
  ]
}

输出严格 JSON, 不要 <think> 不要 markdown。`;

async function processFile(filename, isMixed) {
  console.log(`\n=== ${filename} ===`);
  const fp = path.join(TXT_DIR, filename);
  const text = await fs.readFile(fp, "utf-8");
  const yearMatch = filename.match(/(20\d{2})/);
  const fileYear = yearMatch ? yearMatch[1] : "2020";
  console.log(`  ${text.length} chars, year=${fileYear}, sending to MiniMax...`);

  const userMsg = `${isMixed ? PROMPT_MIXED : PROMPT_TASK2}

文件年份提示: ${fileYear} (没有日期的题目用 ${fileYear}-01-01 兜底)

--- 文本开始 ---
${text}
--- 文本结束 ---`;

  try {
    const result = await chatJSON({ user: userMsg, maxTokens: 16000 });
    const items = Array.isArray(result.prompts) ? result.prompts : [];
    console.log(`  -> ${items.length} prompts`);
    return items;
  } catch (e) {
    console.log(`  ERR: ${e.message}`);
    return [];
  }
}

function dedupe(prompts) {
  const seen = new Map();
  const out = [];
  for (const p of prompts) {
    const key = (p.promptText || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .slice(0, 80);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.set(key, true);
    out.push(p);
  }
  return out;
}

async function main() {
  const all = [];

  for (const f of TASK2_FILES) {
    const items = await processFile(f, false);
    for (const it of items) {
      all.push({
        ...it,
        taskType: "task2",
        sourceFile: f
      });
    }
  }

  for (const f of MIXED_FILES) {
    const items = await processFile(f, true);
    for (const it of items) {
      all.push({ ...it, sourceFile: f });
    }
  }

  console.log(`\n[before dedupe] ${all.length}`);
  const deduped = dedupe(all);
  console.log(`[after dedupe]  ${deduped.length}`);

  deduped.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(deduped, null, 2), "utf-8");
  console.log(`\nwrote -> ${OUT}`);
  const t1 = deduped.filter((p) => p.taskType === "task1").length;
  const t2 = deduped.filter((p) => p.taskType === "task2").length;
  console.log(`task1: ${t1}, task2: ${t2}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
