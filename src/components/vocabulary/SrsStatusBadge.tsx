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

  // detailed 模式: 一行紧凑展示, 把所有细节塞进 title (tooltip 鼠标悬停看)
  // ease 转人话: <2.0 难, 2.0-2.5 普通, ≥2.5 简单
  // 注意 d.ease 是已格式化的字符串, 这里直接读原始 progress.ease
  const easeNum = progress.ease ?? 2.5;
  const difficultyLabel =
    easeNum >= 2.5 ? "简单" : easeNum >= 2.0 ? "普通" : "难";
  const tooltipParts = [
    d.intervalDays > 0 ? `间隔 ${d.intervalDays} 天` : "首次学习",
    `ease ${d.ease}(${difficultyLabel})`,
    d.repetitions > 0 ? `连对 ${d.repetitions} 次` : null,
    d.lastQuality !== null
      ? `上次反馈: ${QUALITY_LABEL[d.lastQuality] ?? d.lastQuality}`
      : null,
    d.wrongCount > 0 ? `累计错 ${d.wrongCount} 次` : null,
    d.lastReviewedHuman ? `${d.lastReviewedHuman}复习过` : null
  ].filter(Boolean) as string[];
  const tooltip = tooltipParts.join(" · ");

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-xs ${className ?? ""}`}
      title={tooltip}
    >
      <span className={`pill ${c.bg} ${c.text}`}>{d.dueLabel}</span>
      <span className="pill bg-bg-soft text-ink-soft">难度{difficultyLabel}</span>
      {d.lastReviewedHuman ? (
        <span className="muted">{d.lastReviewedHuman}复习</span>
      ) : null}
      <span className="muted text-[10px]">(悬停看详情)</span>
    </div>
  );
}
