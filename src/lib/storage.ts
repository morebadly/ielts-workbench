import type {
  DailyTaskProgress,
  DailyTaskTargets,
  DictationResult,
  ListeningItem,
  ReviewItem,
  UserProgress,
  VocabularyBook,
  Word,
  WordProgress,
  WritingPractice
} from "@/types";
import { todayKey } from "./utils";

const PREFIX = "ielts-wb:";
const KEYS = {
  user: PREFIX + "user-progress",
  wordProgress: PREFIX + "word-progress",
  wordExamples: PREFIX + "word-examples",
  dictation: PREFIX + "dictation-results",
  writing: PREFIX + "writing-practice",
  review: PREFIX + "review-items",
  dailyProgress: PREFIX + "daily-progress",
  books: PREFIX + "vocab-books",
  bookWords: PREFIX + "vocab-book-words",
  customListening: PREFIX + "custom-listening-items"
} as const;

const SYNC_META_KEY = PREFIX + "sync-meta";
const KEY_TS_KEY = PREFIX + "key-timestamps";

export const STORAGE_KEYS = KEYS;

export interface SyncMeta {
  lastSyncedAt: number | null;
  lastSyncedUserId: string | null;
}

/** 每个被同步的 key 上次本地修改的时间戳。用于 last-write-wins per key 决策。 */
export type KeyTimestamps = Partial<Record<keyof typeof KEYS, number>>;

const DEFAULT_SYNC_META: SyncMeta = {
  lastSyncedAt: null,
  lastSyncedUserId: null
};

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

/** localStorage key -> KEYS 字段名(如 "ielts-wb:word-progress" -> "wordProgress") */
const KEY_REVERSE: Record<string, keyof typeof KEYS> = Object.fromEntries(
  (Object.entries(KEYS) as Array<[keyof typeof KEYS, string]>).map(
    ([name, raw]) => [raw, name]
  )
) as Record<string, keyof typeof KEYS>;

function getKeyTimestamps(): KeyTimestamps {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(KEY_TS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as KeyTimestamps;
  } catch {
    return {};
  }
}

function setKeyTimestamps(ts: KeyTimestamps): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY_TS_KEY, JSON.stringify(ts));
  } catch {
    /* ignore */
  }
}

/** 标记某个 storage key 在本地刚被修改 */
function touchKey(key: string, at = Date.now()): void {
  const name = KEY_REVERSE[key];
  if (!name) return;
  const ts = getKeyTimestamps();
  ts[name] = at;
  setKeyTimestamps(ts);
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
    // 自动 touch 时间戳, 给 last-write-wins 同步用
    touchKey(key);
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

  /** v1.9: AI 按需生成的例句 (wordId → {sentence, translation, memoryTip}) */
  getWordExamples(): Record<
    string,
    { exampleSentence: string; exampleTranslation: string; memoryTip: string }
  > {
    return read(KEYS.wordExamples, {});
  },
  setWordExample(
    wordId: string,
    data: { exampleSentence: string; exampleTranslation: string; memoryTip: string }
  ): void {
    const map = this.getWordExamples();
    map[wordId] = data;
    write(KEYS.wordExamples, map);
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

  getCustomBooks(): VocabularyBook[] {
    return read<VocabularyBook[]>(KEYS.books, []);
  },
  saveBook(book: VocabularyBook, words: Word[]): void {
    const books = this.getCustomBooks();
    const idx = books.findIndex((b) => b.id === book.id);
    if (idx >= 0) books[idx] = book;
    else books.push(book);
    write(KEYS.books, books);
    const map = read<Record<string, Word[]>>(KEYS.bookWords, {});
    map[book.id] = words;
    write(KEYS.bookWords, map);
  },
  getBookWords(bookId: string): Word[] {
    const map = read<Record<string, Word[]>>(KEYS.bookWords, {});
    return map[bookId] || [];
  },
  /** v1.10.3: 整本书的词列表全量替换, 用于批量 AI 修正(补词性等) */
  setBookWords(bookId: string, words: Word[]): void {
    const map = read<Record<string, Word[]>>(KEYS.bookWords, {});
    map[bookId] = words;
    write(KEYS.bookWords, map);
  },
  deleteBook(bookId: string): void {
    const books = this.getCustomBooks().filter((b) => b.id !== bookId);
    write(KEYS.books, books);
    const map = read<Record<string, Word[]>>(KEYS.bookWords, {});
    delete map[bookId];
    write(KEYS.bookWords, map);
  },
  /** v1.9: 改 wordsPerDay 等元信息, 不动单词数据 */
  updateBookMeta(bookId: string, patch: Partial<VocabularyBook>): void {
    const books = this.getCustomBooks();
    const idx = books.findIndex((b) => b.id === bookId);
    if (idx < 0) return;
    books[idx] = { ...books[idx], ...patch, id: bookId };
    write(KEYS.books, books);
  },

  // ============ v1.8.1: 自定义听力素材 ============
  getCustomListening(): ListeningItem[] {
    return read<ListeningItem[]>(KEYS.customListening, []);
  },
  saveCustomListening(item: ListeningItem): void {
    const all = this.getCustomListening();
    const idx = all.findIndex((x) => x.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.push(item);
    write(KEYS.customListening, all);
  },
  deleteCustomListening(id: string): void {
    const all = this.getCustomListening().filter((x) => x.id !== id);
    write(KEYS.customListening, all);
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
  /** v1.9: 把今天的完成度全部清零 (不影响历史记录, 不影响 word-progress) */
  resetTodayProgress(): DailyTaskProgress {
    const date = todayKey();
    const all = read<Record<string, DailyTaskProgress>>(KEYS.dailyProgress, {});
    const empty: DailyTaskProgress = {
      date,
      newWordsDone: 0,
      reviewWordsDone: 0,
      dictationDone: 0,
      vocabularyArticleDone: 0,
      writingSentencesDone: 0,
      listeningSessionsDone: 0
    };
    all[date] = empty;
    write(KEYS.dailyProgress, all);
    return empty;
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
  importAll(json: string): { imported: number; skipped: number; skippedKeys: string[] } {
    if (!isBrowser()) return { imported: 0, skipped: 0, skippedKeys: [] };
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw new Error(`导入失败: JSON 格式错误 - ${(e as Error).message}`);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("导入失败: 顶层应为对象");
    }
    const allowed = new Set<string>(Object.values(KEYS));
    let imported = 0;
    let skipped = 0;
    const skippedKeys: string[] = [];
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!allowed.has(k)) {
        skipped++;
        skippedKeys.push(k);
        continue;
      }
      window.localStorage.setItem(k, JSON.stringify(v));
      imported++;
    }
    return { imported, skipped, skippedKeys };
  },
  clearAll(): void {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  },

  getSyncMeta(): SyncMeta {
    return read<SyncMeta>(SYNC_META_KEY, DEFAULT_SYNC_META);
  },
  setSyncMeta(m: SyncMeta): void {
    write(SYNC_META_KEY, m);
  },
  patchSyncMeta(patch: Partial<SyncMeta>): SyncMeta {
    const next = { ...this.getSyncMeta(), ...patch };
    this.setSyncMeta(next);
    return next;
  },

  exportSyncSnapshot(): Record<string, unknown> {
    if (!isBrowser()) return {};
    const dump: Record<string, unknown> = {};
    Object.values(KEYS).forEach((k) => {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        try {
          dump[k] = JSON.parse(raw);
        } catch {
          /* skip corrupt */
        }
      }
    });
    return dump;
  },

  /** 读单个 key 的本地修改时间戳, 没有就返回 0 */
  getKeyModifiedAt(key: string): number {
    const name = KEY_REVERSE[key];
    if (!name) return 0;
    return getKeyTimestamps()[name] ?? 0;
  },

  /** 读全部 key 的本地修改时间戳 (raw localStorage key -> ms) */
  getAllKeyModifiedAt(): Record<string, number> {
    const ts = getKeyTimestamps();
    const out: Record<string, number> = {};
    (Object.entries(KEYS) as Array<[keyof typeof KEYS, string]>).forEach(
      ([name, raw]) => {
        out[raw] = ts[name] ?? 0;
      }
    );
    return out;
  },

  /** 拉取后, 把云端的修改时间戳记到本地, 避免重复推送 */
  setKeyModifiedAt(key: string, at: number): void {
    const name = KEY_REVERSE[key];
    if (!name) return;
    const ts = getKeyTimestamps();
    ts[name] = at;
    setKeyTimestamps(ts);
  },

  /** 直接写入单个 key (不走 touch, 因为这是从云端 pull 下来的) */
  writeRawKey(key: string, value: unknown): void {
    if (!isBrowser()) return;
    if (!KEY_REVERSE[key]) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },

  applySyncSnapshot(snapshot: Record<string, unknown>): {
    applied: number;
    skipped: number;
  } {
    if (!isBrowser()) return { applied: 0, skipped: 0 };
    const allowed = new Set<string>(Object.values(KEYS));
    let applied = 0;
    let skipped = 0;
    for (const [k, v] of Object.entries(snapshot)) {
      if (!allowed.has(k)) {
        skipped++;
        continue;
      }
      try {
        window.localStorage.setItem(k, JSON.stringify(v));
        applied++;
      } catch {
        skipped++;
      }
    }
    if (applied > 0 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("ielts-wb:sync-applied"));
    }
    return { applied, skipped };
  }
};

export { DEFAULT_TARGETS };
