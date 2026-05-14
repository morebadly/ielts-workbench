import type {
  DailyTaskProgress,
  DailyTaskTargets,
  DictationResult,
  ReviewItem,
  UserProgress,
  WordProgress,
  WritingPractice
} from "@/types";
import { todayKey } from "./utils";

const PREFIX = "ielts-wb:";
const KEYS = {
  user: PREFIX + "user-progress",
  wordProgress: PREFIX + "word-progress",
  dictation: PREFIX + "dictation-results",
  writing: PREFIX + "writing-practice",
  review: PREFIX + "review-items",
  dailyProgress: PREFIX + "daily-progress"
} as const;

const DEFAULT_TARGETS: DailyTaskTargets = {
  newWords: 10,
  reviewWords: 10,
  dictation: 10,
  vocabularyArticle: 1,
  writingSentences: 2,
  listeningSessions: 1
};

const DEFAULT_USER: UserProgress = {
  activeBookId: "ielts-core-3000",
  currentDay: 1,
  streakDays: 0,
  lastStudyDate: null,
  totalWordsLearned: 0,
  preferences: { voice: "uk", targets: DEFAULT_TARGETS }
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded - ignore for v1 */
  }
}

export const storage = {
  getUser(): UserProgress {
    return read<UserProgress>(KEYS.user, DEFAULT_USER);
  },
  setUser(u: UserProgress): void {
    write(KEYS.user, u);
  },
  patchUser(patch: Partial<UserProgress>): UserProgress {
    const next = { ...this.getUser(), ...patch };
    this.setUser(next);
    return next;
  },

  getWordProgressMap(): Record<string, WordProgress> {
    return read<Record<string, WordProgress>>(KEYS.wordProgress, {});
  },
  setWordProgress(p: WordProgress): void {
    const map = this.getWordProgressMap();
    map[p.wordId] = p;
    write(KEYS.wordProgress, map);
  },

  getDictationResults(): DictationResult[] {
    return read<DictationResult[]>(KEYS.dictation, []);
  },
  appendDictationResult(r: DictationResult): void {
    const all = this.getDictationResults();
    all.push(r);
    write(KEYS.dictation, all.slice(-500));
  },

  getWritingPractices(): WritingPractice[] {
    return read<WritingPractice[]>(KEYS.writing, []);
  },
  appendWritingPractice(p: WritingPractice): void {
    const all = this.getWritingPractices();
    all.push(p);
    write(KEYS.writing, all.slice(-200));
  },
  updateWritingPractice(id: string, patch: Partial<WritingPractice>): void {
    const all = this.getWritingPractices();
    const idx = all.findIndex((x) => x.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...patch };
      write(KEYS.writing, all);
    }
  },

  getReviewItems(): ReviewItem[] {
    return read<ReviewItem[]>(KEYS.review, []);
  },
  setReviewItems(items: ReviewItem[]): void {
    write(KEYS.review, items);
  },
  upsertReviewItem(item: ReviewItem): void {
    const all = this.getReviewItems();
    const idx = all.findIndex((x) => x.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.push(item);
    write(KEYS.review, all);
  },

  getDailyProgress(date: string = todayKey()): DailyTaskProgress {
    const all = read<Record<string, DailyTaskProgress>>(KEYS.dailyProgress, {});
    return (
      all[date] || {
        date,
        newWordsDone: 0,
        reviewWordsDone: 0,
        dictationDone: 0,
        vocabularyArticleDone: 0,
        writingSentencesDone: 0,
        listeningSessionsDone: 0
      }
    );
  },
  bumpDailyProgress(field: keyof Omit<DailyTaskProgress, "date">, by = 1): DailyTaskProgress {
    const date = todayKey();
    const all = read<Record<string, DailyTaskProgress>>(KEYS.dailyProgress, {});
    const prev = all[date] || this.getDailyProgress(date);
    const next: DailyTaskProgress = { ...prev, [field]: prev[field] + by };
    all[date] = next;
    write(KEYS.dailyProgress, all);
    return next;
  },

  exportAll(): string {
    if (!isBrowser()) return "{}";
    const dump: Record<string, unknown> = {};
    Object.values(KEYS).forEach((k) => {
      const raw = window.localStorage.getItem(k);
      if (raw) dump[k] = JSON.parse(raw);
    });
    return JSON.stringify(dump, null, 2);
  },
  importAll(json: string): void {
    if (!isBrowser()) return;
    const parsed = JSON.parse(json) as Record<string, unknown>;
    Object.entries(parsed).forEach(([k, v]) => {
      window.localStorage.setItem(k, JSON.stringify(v));
    });
  },
  clearAll(): void {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  }
};

export { DEFAULT_TARGETS };
