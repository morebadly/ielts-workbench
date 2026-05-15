import type { WordProgress } from "@/types";
import { daysUntilDue, isDueForReview } from "./srs";

/**
 * 把 WordProgress 转成 UI 友好的展示字段。
 * 不修改原对象,只读派生。
 */
export interface SrsDisplay {
  /** "已到期" / "今天到期" / "X 天后" / "X 天前过期" / "未启用" */
  dueLabel: string;
  /** "due_now" | "due_today" | "future" | "overdue" | "new" */
  dueState: "new" | "due_now" | "due_today" | "future" | "overdue";
  /** SM-2 当前间隔(天) */
  intervalDays: number;
  /** SM-2 ease,保留 1 位小数 */
  ease: string;
  /** 连续答对次数 */
  repetitions: number;
  /** 上次反馈质量 0-5,null 表示从未复习过 */
  lastQuality: number | null;
  /** 累计错次 */
  wrongCount: number;
  /** 累计复习次数 */
  reviewCount: number;
  /** 最近一次复习的人类时间,如 "2 小时前" */
  lastReviewedHuman: string | null;
}

function humanizePast(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} 个月前`;
  return `${Math.floor(mo / 12)} 年前`;
}

export function computeSrsDisplay(p: WordProgress, now = Date.now()): SrsDisplay {
  const days = daysUntilDue(p, now);
  const due = isDueForReview(p, now);

  let dueState: SrsDisplay["dueState"];
  let dueLabel: string;
  if (p.status === "new") {
    dueState = "new";
    dueLabel = "未启用";
  } else if (days === null) {
    dueState = "due_now";
    dueLabel = "立即复习";
  } else if (days < 0) {
    dueState = "overdue";
    dueLabel = `已过期 ${Math.abs(days)} 天`;
  } else if (days === 0) {
    dueState = due ? "due_now" : "due_today";
    dueLabel = due ? "立即复习" : "今天到期";
  } else {
    dueState = "future";
    dueLabel = `${days} 天后`;
  }

  return {
    dueLabel,
    dueState,
    intervalDays: p.intervalDays ?? 0,
    ease: (p.ease ?? 2.5).toFixed(1),
    repetitions: p.repetitions ?? 0,
    lastQuality: typeof p.lastQuality === "number" ? p.lastQuality : null,
    wrongCount: p.wrongCount,
    reviewCount: p.reviewCount,
    lastReviewedHuman: p.lastReviewedAt ? humanizePast(p.lastReviewedAt, now) : null
  };
}

const STATE_COLOR: Record<SrsDisplay["dueState"], { bg: string; text: string }> = {
  new: { bg: "bg-bg-soft", text: "text-ink-soft" },
  due_now: { bg: "bg-accent-rose/15", text: "text-accent-rose" },
  due_today: { bg: "bg-amber-200/40", text: "text-amber-700" },
  future: { bg: "bg-brand-100", text: "text-brand-700" },
  overdue: { bg: "bg-accent-rose/20", text: "text-accent-rose" }
};

export function getSrsBadgeColor(state: SrsDisplay["dueState"]) {
  return STATE_COLOR[state];
}
