import type { ListeningItem } from "@/types";

export const MOCK_LISTENING: ListeningItem[] = [
  {
    id: "ls-001",
    title: "University Library Orientation",
    audioUrl: "",
    transcript: `Welcome to the university library. As a new student, you can borrow up to ten books at a time, and the standard loan period is three weeks. If you need a book that has already been borrowed, you can place a reservation online. Please note that fines apply to overdue items, so make sure to return your books before the due date.`,
    keyPhrases: [
      "borrow up to ten books",
      "loan period is three weeks",
      "place a reservation online",
      "fines apply to overdue items"
    ],
    difficulty: "easy"
  },
  {
    id: "ls-002",
    title: "Lecture: Renewable Energy",
    audioUrl: "",
    transcript: `Today we'll look at how renewable energy has reshaped the electricity market. Solar and wind together now account for approximately one third of new capacity worldwide, a figure that would have seemed impossible a decade ago. The main challenge, however, is storage: when the sun does not shine and the wind does not blow, the grid still needs power.`,
    keyPhrases: [
      "renewable energy",
      "one third of new capacity",
      "the main challenge is storage",
      "the grid still needs power"
    ],
    difficulty: "medium"
  }
];

export function getListeningById(id: string): ListeningItem | undefined {
  return MOCK_LISTENING.find((l) => l.id === id);
}
