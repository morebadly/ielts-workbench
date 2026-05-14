import type { WordProgress, WordStatus } from "@/types";

const DAY = 24 * 3600 * 1000;

const INTERVALS: Record<WordStatus, number> = {
  new: 0,
  seen: 1 * DAY,
  canRead: 2 * DAY,
  canRecognize: 4 * DAY,
  canWrite: 7 * DAY,
  canUse: 14 * DAY
};

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
    ease: 2.5
  };
}

export type Feedback = "remember" | "fuzzy" | "forget";

export function applyFeedback(p: WordProgress, fb: Feedback, now = Date.now()): WordProgress {
  let status = p.status;
  let ease = p.ease;
  if (fb === "remember") {
    status = NEXT_ON_REMEMBER[status];
    ease = Math.min(3.5, ease + 0.1);
  } else if (fb === "fuzzy") {
    ease = Math.max(1.5, ease - 0.05);
  } else {
    status = PREV_ON_FORGET[status];
    ease = Math.max(1.3, ease - 0.2);
  }
  const interval = Math.max(0, INTERVALS[status] * (ease / 2.5));
  return {
    ...p,
    status,
    ease,
    reviewCount: p.reviewCount + 1,
    wrongCount: p.wrongCount + (fb === "forget" ? 1 : 0),
    lastReviewedAt: now,
    nextReviewAt: now + interval
  };
}

export function isDueForReview(p: WordProgress, now = Date.now()): boolean {
  if (p.status === "new") return false;
  if (p.nextReviewAt == null) return true;
  return p.nextReviewAt <= now;
}
