"use client";

import { useMemo } from "react";
import Link from "next/link";
import { findSimonEssayForPrompt } from "@/data/simonEssaysLoader";

interface Props {
  /** 当前题目 (用于查找最相关的 Simon 范文) */
  promptText: string;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * v1.10.6 任务 B: 机考页"看 Simon 怎么写"弹窗。
 *
 * 根据当前题干用关键词匹配, 找最相关的 Simon 9 分范文展示。
 * 找不到匹配 -> 引导跳到 /writing/models 浏览全部。
 */
export function SimonEssayDialog({ promptText, onClose }: Props) {
  const matched = useMemo(() => findSimonEssayForPrompt(promptText), [promptText]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-bg-card shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
          <h3 className="text-base font-semibold">Simon 9 分范文参考</h3>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm hover:bg-bg-soft"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {matched ? (
            <article className="space-y-4">
              <div className="rounded-lg bg-brand-50 p-3">
                <div className="text-xs text-brand-700">匹配范文 · {matched.titleZh}</div>
                <p className="mt-1 font-serif text-[14px] leading-relaxed">
                  {matched.promptText}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-bg-soft px-2 py-0.5 muted">
                    Task {matched.taskType === "task1" ? "1" : "2"}
                  </span>
                  <span className="rounded-md bg-bg-soft px-2 py-0.5 muted">
                    {matched.wordCount} words
                  </span>
                  <span className="rounded-md bg-accent-warm/15 px-2 py-0.5 text-amber-800">
                    Band {matched.band}
                  </span>
                </div>
              </div>
              <div className="space-y-3 font-serif text-[15px] leading-relaxed">
                {matched.essay.split(/\n\n+/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <p className="border-t border-dashed border-black/10 pt-3 text-xs muted">
                范文来自 IELTS 考官 Simon (ielts-simon.com), 仅供学习参考。
              </p>
            </article>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm muted">
                这道题没找到完全对口的 Simon 范文,
                <br />
                可以去看全部 28 篇精选范文找思路。
              </p>
              <Link
                href="/writing/models"
                className="mt-3 inline-block rounded-md bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
                onClick={onClose}
              >
                打开 Simon 范文库 →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
