import type { WordProgress, WordStatus } from "@/types";

/**
 * SM-2 SuperMemo 复习算法 (改良版)
 *
 * 三档反馈映射 SM-2 的 quality (0-5):
 *   forget   -> q=2  (低于 3, 视作未掌握, repetitions 重置)
 *   fuzzy    -> q=3  (勉强答对, repetitions 不增加, 间隔保留)
 *   remember -> q=5  (轻松答对, repetitions++, 间隔按 ease 增长)
 *
 * 间隔规则:
 *   q < 3:        interval = 1 天
 *   q == 3:       间隔保留, ease 微降
 *   reps == 1 && q >= 4:  interval = 1 天
 *   reps == 2 && q >= 4:  interval = 6 天
 *   reps >= 3 && q >= 4:  interval = prevInterval * ease
 *
 * ease 更新: ease' = max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 *
 * 兼容: 保留原 status 字段做语义层 (会读/会认/会写/会用), SM-2 只管 due 时间。
 */

const DAY = 24 * 3600 * 1000;
const MIN_EASE = 1.3;
const MAX_EASE = 3.5;
const MAX_INTERVAL_DAYS = 365;

const NEXT_ON_REMEMBER: Record<WordStatus, WordStatus> = {
  new: "seen",
  seen: "canRead",
  canRead: "canRecognize",
  canRecognize: "canWrite",
  canWrite: "canUse",
  canUse: "canUse"
};

const PREV_ON_FORGET: Record<WordStatus, WordStatus> = {
  new: "new",
  seen: "new",
  canRead: "seen",
  canRecognize: "canRead",
  canWrite: "canRecognize",
  canUse: "canWrite"
};

export function initWordProgress(wordId: string): WordProgress {
  return {
    wordId,
    status: "new",
    reviewCount: 0,
    wrongCount: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0
  };
}

export type Feedback = "remember" | "fuzzy" | "forget";

const FEEDBACK_TO_QUALITY: Record<Feedback, number> = {
  forget: 2,
  fuzzy: 3,
  remember: 5
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function migrateIfNeeded(p: WordProgress): WordProgress {
  // 老数据没有 intervalDays / repetitions,从 status 反推一次,后续就走 SM-2。
  if (p.intervalDays !== undefined && p.repetitions !== undefined) return p;

  const fallbackByStatus: Record<WordStatus, { interval: number; reps: number }> = {
    new: { interval: 0, reps: 0 },
    seen: { interval: 1, reps: 1 },
    canRead: { interval: 2, reps: 1 },
    canRecognize: { interval: 4, reps: 2 },
    canWrite: { interval: 7, reps: 3 },
    canUse: { interval: 14, reps: 4 }
  };
  const guess = fallbackByStatus[p.status];
  return {
    ...p,
    intervalDays: p.intervalDays ?? guess.interval,
    repetitions: p.repetitions ?? guess.reps
  };
}

/**
 * 应用一次复习反馈, 返回更新后的 WordProgress。
 * 公开签名保持不变(WordCard 等老调用方无感)。
 */
export function applyFeedback(
  p: WordProgress,
  fb: Feedback,
  now = Date.now()
): WordProgress {
  const cur = migrateIfNeeded(p);
  const q = FEEDBACK_TO_QUALITY[fb];

  // 1. ease 更新 (SM-2 标准公式)
  let ease = cur.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  ease = clamp(ease, MIN_EASE, MAX_EASE);

  // 2. interval / repetitions 更新
  let repetitions = cur.repetitions ?? 0;
  let intervalDays = cur.intervalDays ?? 0;

  if (q < 3) {
    // forget: 重新开始, 但保留少量间隔避免下次马上又出现
    repetitions = 0;
    intervalDays = 1;
  } else if (q === 3) {
    // fuzzy: 模糊回忆, 间隔不变(至少 1 天), repetitions 不增
    intervalDays = Math.max(1, intervalDays);
  } else {
    // remember
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
  }
  intervalDays = clamp(intervalDays, 0, MAX_INTERVAL_DAYS);

  // 3. status 仍然按三档语义升降
  let status = cur.status;
  if (fb === "remember") status = NEXT_ON_REMEMBER[status];
  else if (fb === "forget") status = PREV_ON_FORGET[status];

  return {
    ...cur,
    status,
    ease,
    intervalDays,
    repetitions,
    lastQuality: q,
    reviewCount: cur.reviewCount + 1,
    wrongCount: cur.wrongCount + (fb === "forget" ? 1 : 0),
    lastReviewedAt: now,
    nextReviewAt: now + intervalDays * DAY
  };
}

export function isDueForReview(p: WordProgress, now = Date.now()): boolean {
  if (p.status === "new") return false;
  if (p.nextReviewAt == null) return true;
  return p.nextReviewAt <= now;
}

/** 给设置/统计页用:一个进度的下次复习还有多久(天,负数=已过期) */
export function daysUntilDue(p: WordProgress, now = Date.now()): number | null {
  if (p.nextReviewAt == null) return null;
  return Math.round((p.nextReviewAt - now) / DAY);
}
