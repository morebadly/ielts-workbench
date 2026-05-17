"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { WritingPrompt, WritingTaskType } from "@/types";
import {
  REAL_WRITING_PROMPTS,
  REAL_WRITING_PROMPTS_META
} from "@/data/writingPrompts";

interface Props {
  taskType: WritingTaskType;
  open: boolean;
  onClose: () => void;
  onPick: (prompt: WritingPrompt) => void;
}

const CATEGORY_OPTIONS = [
  { id: "all", label: "全部" },
  { id: "Discussion", label: "Discuss both" },
  { id: "Opinion", label: "Agree/Disagree" },
  { id: "CauseSolution", label: "Cause & Solution" },
  { id: "PositiveNegative", label: "Pos / Neg" },
  { id: "TwoPartQuestion", label: "Two-part" }
];

/**
 * v1.10.6 任务A: 真题题库浏览器
 * - 只展示真题 (REAL_WRITING_PROMPTS), 不混 mock
 * - 按 taskType 过滤 (跟外面 select 同步), 再按年份/类别/关键词筛
 * - 数据量 329 条, 直接全量过滤渲染足够流畅, 不做分页 (用 max-h + overflow-y)
 */
export function PromptLibraryDialog({ taskType, open, onClose, onPick }: Props) {
  const [year, setYear] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    if (!open) return [];
    const kw = keyword.trim().toLowerCase();
    const items: Array<{ prompt: WritingPrompt; date: string; category?: string | null }> = [];
    for (let i = 0; i < REAL_WRITING_PROMPTS.length; i++) {
      const prompt = REAL_WRITING_PROMPTS[i];
      const meta = REAL_WRITING_PROMPTS_META[i];
      if (prompt.taskType !== taskType) continue;
      if (year !== "all" && !(meta.date || "").startsWith(year)) continue;
      if (category !== "all" && meta.category !== category) continue;
      if (kw && !prompt.promptText.toLowerCase().includes(kw)) continue;
      items.push({ prompt, date: meta.date || "", category: meta.category });
    }
    return items;
  }, [open, taskType, year, category, keyword]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const m of REAL_WRITING_PROMPTS_META) {
      const y = (m.date || "").slice(0, 4);
      if (y) set.add(y);
    }
    return ["all", ...Array.from(set).sort((a, b) => b.localeCompare(a))];
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-bg-card sm:max-w-3xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-black/5 p-4">
          <div>
            <h3 className="text-base font-semibold sm:text-lg">
              真题题库 · {taskType === "task1" ? "Task 1 小作文" : "Task 2 大作文"}
            </h3>
            <p className="mt-0.5 text-xs muted">
              共 {filtered.length} / {REAL_WRITING_PROMPTS.filter((p) => p.taskType === taskType).length} 题
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg px-3 py-1 text-sm hover:bg-bg-soft"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 border-b border-black/5 p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            <select
              className="input h-8 text-xs sm:w-32"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y === "all" ? "全部年份" : `${y} 年`}
                </option>
              ))}
            </select>
            {taskType === "task2" ? (
              <select
                className="input h-8 text-xs sm:w-44"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : null}
            <Button
              variant="ghost"
              className="h-8 px-3 text-xs"
              onClick={() => {
                if (filtered.length === 0) return;
                const pick = filtered[Math.floor(Math.random() * filtered.length)];
                onPick(pick.prompt);
              }}
            >
              🎲 随机抽题
            </Button>
          </div>
          <input
            className="input h-8 w-full text-xs"
            placeholder="按英文关键词搜索 (例: environment / education / technology)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm muted">没有符合条件的题目</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {filtered.slice(0, 200).map(({ prompt, date, category: cat }) => (
                <li key={prompt.id} className="py-2.5">
                  <button
                    type="button"
                    className="block w-full text-left transition hover:bg-bg-soft/60"
                    onClick={() => onPick(prompt)}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs muted">
                      {date ? <span className="pill">{date}</span> : null}
                      {cat ? <span className="pill">{cat}</span> : null}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{prompt.promptText}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {filtered.length > 200 ? (
            <p className="mt-2 text-center text-xs muted">
              显示前 200 条, 加搜索词缩窄范围
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
