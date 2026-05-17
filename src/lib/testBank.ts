import type {
  ExamAttempt,
  ExamQuestion,
  ExamQuestionGroup,
  ListeningSection,
  ReadingPassage,
  TestBankItem
} from "@/types";

/**
 * admin 私密区路径前缀。
 *
 * `_kyq6j` 是随机短字符串前缀, 不暴露在导航里, 只你知道。
 * 公开访问者从导航栏 / 站内链接 / sitemap 都摸不到这个路径。
 */
export const ADMIN_PREFIX = "/admin/_kyq6j";
export const TEST_BANK_BASE = `${ADMIN_PREFIX}/test-bank`;

/** 雅思阅读 / 听力 40 题对照 band score (近似, 按官方常用映射) */
export function correctCountToBand(correct: number): number {
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 33) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 27) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 19) return 5.5;
  if (correct >= 15) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 10) return 4.0;
  if (correct >= 8) return 3.5;
  if (correct >= 6) return 3.0;
  return 2.5;
}

/** 把答案规整为可比较的字符串: 去掉首尾空白, 全部小写, 多空格折叠为单空格 */
export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** 单题判分: 用户答案与标准答案对比 */
export function isCorrect(question: ExamQuestion, userInput: string): boolean {
  if (!userInput) return false;
  const user = normalizeAnswer(userInput);
  if (Array.isArray(question.answer)) {
    return question.answer.some((a) => normalizeAnswer(a) === user);
  }
  return normalizeAnswer(question.answer) === user;
}

/** 把一篇阅读 / 一段听力的所有 question 拍平成一维, 方便遍历 */
export function flattenQuestions(
  groups: ExamQuestionGroup[]
): ExamQuestion[] {
  return groups.flatMap((g) => g.questions);
}

export function flattenReadingQuestions(
  reading: ReadingPassage[]
): ExamQuestion[] {
  return reading.flatMap((p) => flattenQuestions(p.groups));
}

export function flattenListeningQuestions(
  listening: ListeningSection[]
): ExamQuestion[] {
  return listening.flatMap((s) => flattenQuestions(s.groups));
}

export function gradeAttempt(
  test: TestBankItem,
  module: "reading" | "listening",
  answers: Record<string, string>
): { total: number; correct: number; bandScore: number } {
  const questions =
    module === "reading"
      ? flattenReadingQuestions(test.reading)
      : flattenListeningQuestions(test.listening);
  let correct = 0;
  for (const q of questions) {
    if (isCorrect(q, answers[q.id] ?? "")) correct++;
  }
  return {
    total: questions.length,
    correct,
    bandScore: correctCountToBand(correct)
  };
}

/** 用户作答 → ExamAttempt 完整记录, 上层调用方负责落盘 */
export function buildAttempt({
  test,
  module,
  answers,
  startedAt,
  durationMs
}: {
  test: TestBankItem;
  module: "reading" | "listening";
  answers: Record<string, string>;
  startedAt: number;
  durationMs: number;
}): ExamAttempt {
  const { total, correct, bandScore } = gradeAttempt(test, module, answers);
  return {
    id: `${test.id}-${module}-${startedAt}`,
    testId: test.id,
    module,
    answers,
    total,
    correct,
    bandScore,
    durationMs,
    startedAt,
    submittedAt: Date.now()
  };
}

/** 阅读 / 听力 推荐时长 (毫秒) */
export const READING_DURATION_MS = 60 * 60 * 1000;
export const LISTENING_DURATION_MS = 30 * 60 * 1000;
