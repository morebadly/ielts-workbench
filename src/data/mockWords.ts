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
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("ielts-wb:vocab-book-words");
      if (raw) {
        const map = JSON.parse(raw) as Record<string, Word[]>;
        const list = map[bookId];
        if (list && list.length) {
          return list
            .filter((w) => w.bookDay === day)
            .sort((a, b) => a.order - b.order);
        }
      }
    } catch {
      /* fall through to MOCK */
    }
  }
  return MOCK_WORDS.filter((w) => w.bookId === bookId && w.bookDay === day).sort(
    (a, b) => a.order - b.order
  );
}

export function getActiveBook(bookId: string): VocabularyBook {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("ielts-wb:vocab-books");
      if (raw) {
        const list = JSON.parse(raw) as VocabularyBook[];
        const found = list.find((b) => b.id === bookId);
        if (found) return found;
      }
    } catch {
      /* fall through */
    }
  }
  return MOCK_BOOK;
}

export function getAllBooks(): VocabularyBook[] {
  const list: VocabularyBook[] = [MOCK_BOOK];
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("ielts-wb:vocab-books");
      if (raw) {
        const custom = JSON.parse(raw) as VocabularyBook[];
        custom.forEach((b) => {
          if (!list.find((x) => x.id === b.id)) list.push(b);
        });
      }
    } catch {
      /* ignore */
    }
  }
  return list;
}

/**
 * 把指定多本词书的词汇合并成一个去重列表。
 *
 * 重复词处理策略:
 *   - 用 word.toLowerCase() 当 key
 *   - 第一本里的版本作为主版本(保留它的 id, phonetic, 释义, 例句)
 *   - 后续重复出现时,在主版本的 wordList 后追加来源标记 "+ <书名>"
 *   - 这样 progress / dictation / article 不会重复刷同一个词,但用户能看到这个词出现在哪几本里
 *
 * @param bookIds 启用的词书 id 列表; 空数组返回 []
 */
export function getWordsFromBooks(bookIds: string[]): Word[] {
  if (!bookIds.length) return [];
  const allBooks = getAllBooks();
  const bookNameById = new Map(allBooks.map((b) => [b.id, b.name]));

  // 内置 mock 走自己, 自定义书走 localStorage
  const collect = (bookId: string): Word[] => {
    if (bookId === MOCK_BOOK.id) {
      return MOCK_WORDS.filter((w) => w.bookId === bookId);
    }
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("ielts-wb:vocab-book-words");
      if (!raw) return [];
      const map = JSON.parse(raw) as Record<string, Word[]>;
      return map[bookId] || [];
    } catch {
      return [];
    }
  };

  const seen = new Map<string, Word>();
  for (const bookId of bookIds) {
    const list = collect(bookId);
    for (const w of list) {
      const key = w.word.trim().toLowerCase();
      if (!key) continue;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, { ...w });
        continue;
      }
      // 已经存在 -> 在 wordList 末尾追加来源, 不替换主版本
      const otherBookName = bookNameById.get(w.bookId);
      if (otherBookName && !existing.wordList.includes(otherBookName)) {
        existing.wordList = `${existing.wordList} · 同时出现于 ${otherBookName}`;
      }
    }
  }
  return Array.from(seen.values());
}

/**
 * 用户启用了哪些 book。 老数据 enabledBookIds 缺失时, 默认就是 [activeBookId]。
 */
export function getEnabledBookIds(user: {
  activeBookId: string;
  enabledBookIds?: string[];
}): string[] {
  if (user.enabledBookIds && user.enabledBookIds.length) {
    return user.enabledBookIds;
  }
  return [user.activeBookId];
}
