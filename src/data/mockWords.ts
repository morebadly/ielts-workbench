import type { VocabularyBook, Word } from "@/types";

export const MOCK_BOOK: VocabularyBook = {
  id: "ielts-core-3000",
  name: "雅思核心 3000",
  totalDays: 30,
  description: "覆盖雅思高频核心词,按 Day 顺序学习"
};

export const MOCK_WORDS: Word[] = [
  {
    id: "w-001",
    word: "significant",
    phonetic: "/sɪɡˈnɪfɪkənt/",
    chineseMeaning: "adj. 重要的;显著的",
    englishDefinition: "sufficiently great or important to be worthy of attention",
    exampleSentence: "There was a significant increase in tourism between 2010 and 2020.",
    exampleTranslation: "2010 至 2020 年间,旅游业出现显著增长。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List A",
    order: 1
  },
  {
    id: "w-002",
    word: "fluctuate",
    phonetic: "/ˈflʌktʃueɪt/",
    chineseMeaning: "v. 波动;起伏",
    englishDefinition: "to rise and fall irregularly in number or amount",
    exampleSentence: "The price of oil fluctuated sharply over the period.",
    exampleTranslation: "石油价格在这段时间内剧烈波动。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List A",
    order: 2
  },
  {
    id: "w-003",
    word: "consume",
    phonetic: "/kənˈsjuːm/",
    chineseMeaning: "v. 消耗;消费",
    englishDefinition: "to use up a resource",
    exampleSentence: "Households in the UK consume more energy in winter than in summer.",
    exampleTranslation: "英国家庭冬季的能源消耗比夏季更多。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List A",
    order: 3
  },
  {
    id: "w-004",
    word: "trend",
    phonetic: "/trend/",
    chineseMeaning: "n. 趋势;走向",
    englishDefinition: "a general direction in which something is developing or changing",
    exampleSentence: "The chart shows an upward trend in online learning.",
    exampleTranslation: "图表显示在线学习呈上升趋势。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List A",
    order: 4
  },
  {
    id: "w-005",
    word: "approximately",
    phonetic: "/əˈprɒksɪmətli/",
    chineseMeaning: "adv. 大约;大致",
    englishDefinition: "used to show that a number, amount or time is not exact",
    exampleSentence: "Approximately 60 percent of respondents agreed with the policy.",
    exampleTranslation: "约 60% 的受访者同意该项政策。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List A",
    order: 5
  },
  {
    id: "w-006",
    word: "facilitate",
    phonetic: "/fəˈsɪlɪteɪt/",
    chineseMeaning: "v. 促进;使便利",
    englishDefinition: "to make an action or process easier",
    exampleSentence: "Public transport can facilitate access to employment in rural areas.",
    exampleTranslation: "公共交通可以方便农村地区的就业。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List B",
    order: 6
  },
  {
    id: "w-007",
    word: "phenomenon",
    phonetic: "/fəˈnɒmɪnən/",
    chineseMeaning: "n. 现象",
    englishDefinition: "a fact or situation that is observed to exist",
    exampleSentence: "Urbanisation is a global phenomenon that affects developing countries most.",
    exampleTranslation: "城市化是一种全球现象,对发展中国家影响最大。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List B",
    order: 7
  },
  {
    id: "w-008",
    word: "diverse",
    phonetic: "/daɪˈvɜːs/",
    chineseMeaning: "adj. 多样的;不同的",
    englishDefinition: "showing a great deal of variety; very different",
    exampleSentence: "Cities tend to be more culturally diverse than small towns.",
    exampleTranslation: "城市通常比小城镇更具文化多样性。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List B",
    order: 8
  },
  {
    id: "w-009",
    word: "implement",
    phonetic: "/ˈɪmplɪment/",
    chineseMeaning: "v. 实施;执行",
    englishDefinition: "to put a decision or plan into effect",
    exampleSentence: "The government implemented strict measures to reduce air pollution.",
    exampleTranslation: "政府实施了严格措施以减少空气污染。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List B",
    order: 9
  },
  {
    id: "w-010",
    word: "consequence",
    phonetic: "/ˈkɒnsɪkwəns/",
    chineseMeaning: "n. 后果;结果",
    englishDefinition: "a result of a particular action or situation",
    exampleSentence: "Long working hours can have serious consequences for mental health.",
    exampleTranslation: "长时间工作会对心理健康产生严重后果。",
    bookId: "ielts-core-3000",
    bookDay: 1,
    wordList: "Day 1 - List B",
    order: 10
  }
];

export function getWordsByDay(bookId: string, day: number): Word[] {
  return MOCK_WORDS.filter((w) => w.bookId === bookId && w.bookDay === day).sort(
    (a, b) => a.order - b.order
  );
}
