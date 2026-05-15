"use client";

import { useMemo, useState } from "react";
import type { WritingHighlightData } from "@/lib/ai/client";

interface Props {
  essay: string;
  highlights: WritingHighlightData[] | undefined;
}

const CATEGORY_LABEL: Record<WritingHighlightData["category"], string> = {
  grammar: "语法",
  vocabulary: "词汇",
  coherence: "衔接",
  task_response: "切题"
};

const CATEGORY_COLOR: Record<
  WritingHighlightData["category"],
  { bg: string; bar: string; text: string }
> = {
  grammar: { bg: "bg-accent-rose/15", bar: "decoration-accent-rose", text: "text-accent-rose" },
  vocabulary: { bg: "bg-amber-200/40", bar: "decoration-amber-600", text: "text-amber-700" },
  coherence: { bg: "bg-sky-200/40", bar: "decoration-sky-600", text: "text-sky-700" },
  task_response: { bg: "bg-violet-200/40", bar: "decoration-violet-600", text: "text-violet-700" }
};

interface Span {
  start: number;
  end: number;
  hi?: WritingHighlightData;
}

/**
 * 在 essay 里逐条 indexOf 找 excerpt 的位置, 把多个区间合并成不重叠 spans。
 * 后到的高亮如果和前面重叠, 直接丢弃, 避免渲染冲突。
 */
function computeSpans(
  essay: string,
  highlights: WritingHighlightData[]
): Span[] {
  const ranges: Array<{ start: number; end: number; hi: WritingHighlightData }> = [];
  for (const h of highlights) {
    if (!h.excerpt || !h.excerpt.trim()) continue;
    const idx = essay.indexOf(h.excerpt);
    if (idx < 0) continue;
    const start = idx;
    const end = idx + h.excerpt.length;
    // 重叠则丢弃
    const overlap = ranges.some(
      (r) => !(end <= r.start || start >= r.end)
    );
    if (overlap) continue;
    ranges.push({ start, end, hi: h });
  }
  ranges.sort((a, b) => a.start - b.start);

  const out: Span[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) out.push({ start: cursor, end: r.start });
    out.push({ start: r.start, end: r.end, hi: r.hi });
    cursor = r.end;
  }
  if (cursor < essay.length) out.push({ start: cursor, end: essay.length });
  return out;
}

export function HighlightedEssay({ essay, highlights }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const list = highlights ?? [];

  const spans = useMemo(() => computeSpans(essay, list), [essay, list]);
  const matched = useMemo(
    () => list.filter((h) => essay.indexOf(h.excerpt) >= 0),
    [essay, list]
  );

  if (!matched.length) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {essay}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="muted">图例</span>
        {(Object.keys(CATEGORY_LABEL) as Array<keyof typeof CATEGORY_LABEL>).map(
          (k) => (
            <span key={k} className={`pill ${CATEGORY_COLOR[k].bg} ${CATEGORY_COLOR[k].text}`}>
              {CATEGORY_LABEL[k]}
            </span>
          )
        )}
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {spans.map((sp, i) => {
          const text = essay.slice(sp.start, sp.end);
          if (!sp.hi) return <span key={i}>{text}</span>;
          const idx = matched.indexOf(sp.hi);
          const c = CATEGORY_COLOR[sp.hi.category];
          const active = idx === activeIdx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(active ? null : idx)}
              className={`mx-px inline rounded ${c.bg} px-0.5 underline decoration-2 underline-offset-2 ${c.bar} ${
                active ? "ring-2 ring-offset-1 ring-brand-500" : ""
              }`}
              title={`${CATEGORY_LABEL[sp.hi.category]} · ${sp.hi.comment}`}
            >
              {text}
            </button>
          );
        })}
      </p>

      <ul className="space-y-2">
        {matched.map((h, i) => {
          const c = CATEGORY_COLOR[h.category];
          const active = activeIdx === i;
          return (
            <li
              key={i}
              className={`rounded-lg border ${
                active ? "border-brand-500 ring-2 ring-brand-500/30" : "border-black/5"
              } p-2 text-xs`}
            >
              <button
                type="button"
                onClick={() => setActiveIdx(active ? null : i)}
                className="flex w-full items-start gap-2 text-left"
              >
                <span className={`pill shrink-0 ${c.bg} ${c.text}`}>
                  {CATEGORY_LABEL[h.category]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 italic text-ink-soft">
                    &ldquo;{h.excerpt}&rdquo;
                  </div>
                  <div className="mt-1 text-ink">{h.comment}</div>
                  {h.suggestion ? (
                    <div className="mt-1 text-brand-700">→ {h.suggestion}</div>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {matched.length < list.length ? (
        <p className="text-xs muted">
          共 {list.length} 条建议,有 {list.length - matched.length} 条原文中无法逐字定位,已折叠到下方反馈原文里。
        </p>
      ) : null}
    </div>
  );
}
