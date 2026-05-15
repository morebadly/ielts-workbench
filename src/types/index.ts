export type WordStatus =
  | "new"
  | "seen"
  | "canRead"
  | "canRecognize"
  | "canWrite"
  | "canUse";

export const WORD_STATUS_LABEL: Record<WordStatus, string> = {
  new: "未学",
  seen: "已看过",
  canRead: "会读",
  canRecognize: "会认",
  canWrite: "会写",
  canUse: "会用"
};

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  chineseMeaning: string;
  englishDefinition: string;
  exampleSentence: string;
  exampleTranslation?: string;
  bookId: string;
  bookDay: number;
  wordList: string;
  order: number;
}

export interface WordProgress {
  wordId: string;
  status: WordStatus;
  reviewCount: number;
  wrongCount: number;
  lastReviewedAt: number | null;
  nextReviewAt: number | null;
  ease: number;
  /** SM-2 当前间隔(单位:天)。老数据可能缺,会在使用时迁移。 */
  intervalDays?: number;
  /** SM-2 连续答对计数。每次 forget 重置为 0。 */
  repetitions?: number;
  /** 最近一次的 quality (0-5),用于历史曲线。可选。 */
  lastQuality?: number;
}

export interface VocabularyBook {
  id: string;
  name: string;
  totalDays: number;
  description?: string;
}

export interface ImportedWord {
  word: string;
  phonetic?: string;
  chineseMeaning: string;
  englishDefinition?: string;
  exampleSentence?: string;
  bookTitle: string;
  bookDay?: string;
  wordList?: string;
  pageNumber?: number;
  order: number;
}

export type DictationMode =
  | "listenWriteWord"
  | "chineseToEnglish"
  | "fillInSentence"
  | "listenWriteSentence";

export interface DictationResult {
  wordId: string;
  mode: DictationMode;
  userInput: string;
  correct: boolean;
  correctedText?: string;
  at: number;
}

export interface VocabularyArticle {
  id: string;
  title: string;
  body: string;
  highlightWordIds: string[];
  questions: ArticleQuestion[];
  generatedFor?: { bookId: string; bookDay: number };
}

export interface ArticleQuestion {
  id: string;
  type: "meaningInContext" | "useWordInIelts" | "listenAndWrite";
  prompt: string;
  targetWordId?: string;
  audioText?: string;
}

export type WritingTaskType = "task1" | "task2";

export interface WritingPrompt {
  id: string;
  taskType: WritingTaskType;
  title: string;
  promptText: string;
  imageUrl?: string;
  minWords: number;
  recommendedMinutes: number;
  recommendedParagraphs: number;
}

export interface WritingPractice {
  id: string;
  promptId: string;
  taskType: WritingTaskType;
  content: string;
  wordCount: number;
  paragraphCount: number;
  hasBlankLineBetweenParagraphs: boolean;
  startedAt: number;
  submittedAt: number | null;
  durationMs: number;
  aiFeedback?: WritingFeedback;
}

export interface WritingFeedback {
  hasOverview?: boolean;
  capturesMainTrend?: boolean;
  dataAccuracy?: number;
  comparisonNatural?: number;
  positionClear?: boolean;
  argumentStrength?: number;
  paragraphLogic?: number;
  vocabRepetition?: number;
  grammarIssues: string[];
  vocabIssues: string[];
  revisedVersion: string;
  comments: string;
  /**
   * v1.8 新增:AI 在原文中标出的具体片段(用于下划线高亮),可选。
   * 老数据不会有此字段,UI 自动降级为只显示 grammarIssues / vocabIssues 文本列表。
   */
  highlights?: WritingHighlight[];
}

export interface WritingHighlight {
  /** 原文中要高亮的片段(精确字符串,UI 用 indexOf 定位) */
  excerpt: string;
  /** 问题类型 */
  category: "grammar" | "vocabulary" | "coherence" | "task_response";
  /** 简短中文/英文说明,15 字内最佳 */
  comment: string;
  /** 建议改写 */
  suggestion?: string;
  /** 严重度,影响下划线颜色 */
  severity?: "info" | "warning" | "error";
}

export interface ListeningItem {
  id: string;
  title: string;
  /** 外部音频 URL(BBC/British Council 公开链接);为空则前端用 MiniMax TTS 朗读 transcript */
  audioUrl: string;
  transcript: string;
  keyPhrases: string[];
  difficulty: "easy" | "medium" | "hard";
  /** 对应 IELTS Listening Section 1-4 的场景类型 */
  section?: 1 | 2 | 3 | 4;
  /** 场景标签:用于挑选 */
  scenario?:
    | "campus"
    | "service"
    | "travel"
    | "academic"
    | "lecture"
    | "monologue"
    | "discussion";
  /** 来源标注:self_written | voa | bbc_le | british_council | external */
  attribution?: "self_written" | "external_link";
  /** 大致单词数(用来估时长) */
  wordCount?: number;
}

export interface ListeningPractice {
  itemId: string;
  userTranscription: string;
  newWords: string[];
  wrongSentences: string[];
  finishedAt: number;
}

export interface ReviewItem {
  id: string;
  type: "word" | "sentence" | "listening" | "writingMistake" | "newsVocab";
  refId: string;
  payload?: Record<string, unknown>;
  due: number;
  ease: number;
  interval: number;
}

export type DailyNewsTopic =
  | "education"
  | "technology"
  | "environment"
  | "society"
  | "health"
  | "work";

export interface DailyNewsVocabItem {
  word: string;
  meaning: string;
  example: string;
}

export interface DailyNewsReadingQA {
  question: string;
  answer: string;
}

export interface DailyNewsItem {
  id: string;
  date: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  topic: DailyNewsTopic;
  originalSummary: string;
  learningSummary: string;
  vocabulary: DailyNewsVocabItem[];
  readingQuestions: DailyNewsReadingQA[];
  writingPrompt: string;
  listeningText: string;
  createdAt: string;
  aiSource?: "minimax" | "mock";
}

export interface DailyTaskTargets {
  newWords: number;
  reviewWords: number;
  dictation: number;
  vocabularyArticle: number;
  writingSentences: number;
  listeningSessions: number;
}

export interface DailyTaskProgress {
  date: string;
  newWordsDone: number;
  reviewWordsDone: number;
  dictationDone: number;
  vocabularyArticleDone: number;
  writingSentencesDone: number;
  listeningSessionsDone: number;
}

export interface UserProgress {
  activeBookId: string;
  currentDay: number;
  streakDays: number;
  lastStudyDate: string | null;
  totalWordsLearned: number;
  /**
   * v1.8.1 新增:勾选启用的所有词书 ID。
   * 影响 review / dictation 等"全集"页面;learn 仍按 activeBookId + currentDay 走 Day。
   * 缺省时 = [activeBookId],老数据零迁移成本。
   */
  enabledBookIds?: string[];
  preferences: {
    voice: "uk" | "us";
    targets: DailyTaskTargets;
  };
  lastLocation?: {
    label: string;
    href: string;
  };
}
