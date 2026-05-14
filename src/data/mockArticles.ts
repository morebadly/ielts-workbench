import type { VocabularyArticle } from "@/types";

export const MOCK_ARTICLES: VocabularyArticle[] = [
  {
    id: "art-day1",
    title: "City Life and Energy Use",
    body: `Over the past two decades, energy consumption in many cities has shown a significant upward trend. Researchers note that household demand fluctuates with the seasons, but the overall pattern is clear: people in urban areas consume more electricity than ever before.

This phenomenon is partly the consequence of larger homes and a more diverse range of electronic devices. Approximately seventy percent of households now own at least three connected appliances. To facilitate a transition to greener living, several governments have implemented stricter energy ratings and offered subsidies for efficient products.

While the impact of these measures is not yet uniform, the early data suggests a small but steady decline in waste. Continued effort will be required if cities are to reverse the long-term trend.`,
    highlightWordIds: [
      "w-001",
      "w-002",
      "w-003",
      "w-004",
      "w-005",
      "w-006",
      "w-007",
      "w-008",
      "w-009",
      "w-010"
    ],
    questions: [
      {
        id: "q1",
        type: "meaningInContext",
        prompt: "在文中,'fluctuate' 最接近的意思是?",
        targetWordId: "w-002"
      },
      {
        id: "q2",
        type: "useWordInIelts",
        prompt: "请用 'implement' 写一句和 IELTS 写作话题相关的句子。",
        targetWordId: "w-009"
      },
      {
        id: "q3",
        type: "listenAndWrite",
        prompt: "听一句并默写。",
        audioText:
          "Approximately seventy percent of households now own at least three connected appliances."
      }
    ],
    generatedFor: { bookId: "ielts-core-3000", bookDay: 1 }
  }
];

export function getArticleForDay(bookId: string, day: number): VocabularyArticle | undefined {
  return MOCK_ARTICLES.find(
    (a) => a.generatedFor?.bookId === bookId && a.generatedFor.bookDay === day
  );
}
