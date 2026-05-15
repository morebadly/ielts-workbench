"use client";

import type { WordProgress } from "@/types";
import { computeSrsDisplay, getSrsBadgeColor } from "@/lib/srsDisplay";

interface Props {
  progress: WordProgress;
  /** 紧凑模式只显示 due 状态条;详细模式额外显示间隔/ease/repetitions */
  variant?: "compact" | "detailed";
  className?: string;
}

const QUALITY_LABEL: Record<number, string> = {
  0: "完全忘",
  1: "几乎忘",
  2: "忘",
  3: "模糊",
  4: "想起来",
  5: "轻松"
};

export function SrsStatusBadge({ progress, variant = "compact", className }: Props) {
  const d = computeSrsDisplay(progress);
  const c = getSrsBadgeColor(d.dueState);

  if (variant === "compact") {
    return (
      <span className={`pill ${c.bg} ${c.text} ${className ?? ""}`}>
        {d.dueLabel}
      </span>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 text-xs ${className ?? ""}`}>
      <span className={`pill ${c.bg} ${c.text}`}>{d.dueLabel}</span>
      {d.intervalDays > 0 ? (
        <span className="pill bg-bg-soft text-ink-soft">间隔 {d.intervalDays} 天</span>
      ) : null}
      <span className="pill bg-bg-soft text-ink-soft">ease {d.ease}</span>
      {d.repetitions > 0 ? (
        <span className="pill bg-bg-soft text-ink-soft">连对 {d.repetitions}</span>
      ) : null}
      {d.lastQuality !== null ? (
        <span className="pill bg-bg-soft text-ink-soft">
          上次 {QUALITY_LABEL[d.lastQuality] ?? d.lastQuality}
        </span>
      ) : null}
      {d.wrongCount > 0 ? (
        <span className="pill bg-accent-rose/10 text-accent-rose">
          错 {d.wrongCount} 次
        </span>
      ) : null}
      {d.lastReviewedHuman ? (
        <span className="muted">{d.lastReviewedHuman}复习</span>
      ) : null}
    </div>
  );
}
