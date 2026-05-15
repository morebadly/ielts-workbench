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
}

export interface ListeningItem {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  keyPhrases: string[];
  difficulty: "easy" | "medium" | "hard";
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
  preferences: {
    voice: "uk" | "us";
    targets: DailyTaskTargets;
  };
  lastLocation?: {
    label: string;
    href: string;
  };
}
