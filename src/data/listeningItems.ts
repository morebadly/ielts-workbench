import type { ListeningItem } from "@/types";
import { BBC_LISTENING_ITEMS } from "./listeningBBC";

/**
 * 自写 IELTS-style 听力素材库 + BBC 6 Minute English 公开节目
 *
 * 设计原则:
 * - 自写部分覆盖 Listening Section 1-4 四种场景 (8 条, easy 4 / medium 3 / hard 1)
 * - BBC 部分挂在 listeningBBC.ts, 直链 BBC CDN, 不占本站带宽
 * - 自写无 audioUrl, 由前端 MiniMax TTS 朗读; BBC 必有 audioUrl
 * - 全部为本人原创或公开节目, 不抄录任何 IELTS 真题
 */
export const LISTENING_ITEMS: ListeningItem[] = [
  // ==================== Section 1: 社交场景对话 ====================
  {
    id: "ls-s1-library",
    title: "University Library Orientation",
    audioUrl: "",
    section: 1,
    scenario: "campus",
    difficulty: "easy",
    attribution: "self_written",
    wordCount: 95,
    transcript:
      "Welcome to the university library. As a new student, you can borrow up to ten books at a time, and the standard loan period is three weeks. If you need a book that has already been borrowed, you can place a reservation online. Please note that fines apply to overdue items, fifty cents per day per book. Group study rooms on the second floor can be booked in two-hour slots, but no more than twice a week. The library is open from eight in the morning until ten at night on weekdays.",
    keyPhrases: [
      "borrow up to ten books",
      "loan period is three weeks",
      "place a reservation online",
      "fifty cents per day",
      "group study rooms on the second floor",
      "two-hour slots"
    ]
  },
  {
    id: "ls-s1-gym",
    title: "Joining a Local Gym",
    audioUrl: "",
    section: 1,
    scenario: "service",
    difficulty: "easy",
    attribution: "self_written",
    wordCount: 110,
    transcript:
      "Hello, I'd like to join the gym. We have three membership types. The basic plan is forty pounds a month and gives you access to the cardio area only. The standard plan is sixty-five pounds and includes the weights room and the swimming pool. Our premium plan is ninety pounds and adds unlimited group classes, including yoga and pilates. All new members pay a one-off joining fee of twenty pounds, but if you sign up before the end of this month, the joining fee is waived. You'll also need to bring a passport-sized photo and proof of address.",
    keyPhrases: [
      "three membership types",
      "forty pounds a month",
      "sixty-five pounds",
      "ninety pounds",
      "joining fee of twenty pounds",
      "proof of address"
    ]
  },
  {
    id: "ls-s1-accommodation",
    title: "Booking Student Accommodation",
    audioUrl: "",
    section: 1,
    scenario: "service",
    difficulty: "easy",
    attribution: "self_written",
    wordCount: 120,
    transcript:
      "Thank you for calling Riverside Student Accommodation. Could I take some details? Your full name, please. And the spelling of your surname is M-A-R-T-I-N-E-Z, that's right. Your booking reference is seven-three-four-double-nine. We have you down for a single room with shared kitchen, on Maple Street, from the fifteenth of September. The weekly rent is one hundred and forty pounds, including all bills. We require a deposit of three hundred pounds, refundable when you leave the property. Please note that the building is non-smoking throughout, and pets are not allowed except for guide dogs.",
    keyPhrases: [
      "booking reference seven-three-four-double-nine",
      "single room with shared kitchen",
      "Maple Street",
      "fifteenth of September",
      "one hundred and forty pounds",
      "deposit of three hundred pounds",
      "non-smoking throughout"
    ]
  },

  // ==================== Section 2: 公共场合独白 ====================
  {
    id: "ls-s2-museum",
    title: "Museum Tour Introduction",
    audioUrl: "",
    section: 2,
    scenario: "monologue",
    difficulty: "medium",
    attribution: "self_written",
    wordCount: 135,
    transcript:
      "Good morning everyone, and welcome to the Eastfield Maritime Museum. The tour will last approximately ninety minutes. We'll start in the main hall, where you can see our largest exhibit, a fully restored eighteenth-century fishing vessel. From there we move to the second floor, which houses the navigation gallery; this is where you'll find original maps, compasses and ships' logs from across three centuries. The third floor is dedicated to the lives of fishing families, and includes a short film that runs every twenty minutes. Please don't take flash photography in the navigation gallery, as the documents are extremely light-sensitive. The cafe and gift shop are on the ground floor, and toilets are on every level. Are there any questions before we begin?",
    keyPhrases: [
      "approximately ninety minutes",
      "eighteenth-century fishing vessel",
      "navigation gallery",
      "original maps, compasses and ships' logs",
      "every twenty minutes",
      "flash photography",
      "extremely light-sensitive"
    ]
  },
  {
    id: "ls-s2-volunteer",
    title: "Volunteer Programme Briefing",
    audioUrl: "",
    section: 2,
    scenario: "monologue",
    difficulty: "medium",
    attribution: "self_written",
    wordCount: 145,
    transcript:
      "Thank you all for coming to this introduction to our community volunteer programme. Volunteers are the backbone of what we do here, and last year alone our two hundred volunteers contributed more than fifteen thousand hours of their time. We have four main programmes you can join. The literacy programme matches volunteers with adult learners; you'd commit to two hours a week for at least six months. The food bank operates on Saturday mornings, and roles range from sorting donations to delivering parcels. Our environmental team meets twice a month for park clean-ups and tree planting. Finally, our digital skills group teaches older residents how to use smartphones and laptops, which has become hugely popular. All volunteers receive a free training session before they start, and you can switch programmes after three months if you'd like to try something different.",
    keyPhrases: [
      "two hundred volunteers",
      "fifteen thousand hours",
      "two hours a week",
      "at least six months",
      "Saturday mornings",
      "twice a month",
      "park clean-ups and tree planting",
      "free training session"
    ]
  },

  // ==================== Section 3: 学术讨论 ====================
  {
    id: "ls-s3-research",
    title: "Research Project Discussion",
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "self_written",
    wordCount: 165,
    transcript:
      "So, Maria, how are things going with your research on urban green spaces? Honestly, slower than I'd hoped. The literature review is more or less done, but I'm struggling with the methodology section. I'm not sure whether to use a quantitative or qualitative approach. What does your supervisor say? She suggested a mixed-methods design, which on paper sounds great, but in practice it's a lot of work for an undergraduate dissertation. I'd start with a survey of around two hundred residents, then follow up with twelve in-depth interviews. That sounds reasonable, but the interviews alone could take you two months once you factor in transcription. Have you applied for ethics approval yet? Not yet, that's actually my next priority. I need to submit the form by the end of October, otherwise I won't be able to start data collection in time. I'd recommend doing a small pilot first, even just five interviews, to test your questions before going to the full sample.",
    keyPhrases: [
      "urban green spaces",
      "literature review",
      "methodology section",
      "quantitative or qualitative approach",
      "mixed-methods design",
      "two hundred residents",
      "twelve in-depth interviews",
      "ethics approval",
      "end of October",
      "pilot first"
    ]
  },
  {
    id: "ls-s3-essay",
    title: "Essay Tutorial",
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "hard",
    attribution: "self_written",
    wordCount: 175,
    transcript:
      "Alright, let's go through your draft on globalisation and labour markets. I think your introduction is too long. You've spent almost six hundred words setting up the question, when really three hundred would be enough. The reader wants to see your argument by the end of page one. The other issue is your evidence: you cite the OECD report from twenty-twenty, but you don't actually engage with their conclusions. You just summarise them. To get a higher mark you need to either challenge the data or use it to build a counter-argument. Also, your three case studies, India, Mexico and Vietnam, are interesting choices, but you don't justify why those three. A reader could legitimately ask, why not Bangladesh, why not the Philippines? You'd want a paragraph upfront explaining your case selection. Finally, the conclusion is weak. You restate the question rather than answering it, and you've avoided taking a clear position. I'd push you to commit to a stronger thesis, even if it's controversial. We can talk about phrasing in our next session.",
    keyPhrases: [
      "globalisation and labour markets",
      "introduction is too long",
      "OECD report from twenty-twenty",
      "challenge the data",
      "build a counter-argument",
      "case selection",
      "stronger thesis"
    ]
  },

  // ==================== Section 4: 学术讲座 ====================
  {
    id: "ls-s4-renewable",
    title: "Lecture: Renewable Energy and the Grid",
    audioUrl: "",
    section: 4,
    scenario: "lecture",
    difficulty: "hard",
    attribution: "self_written",
    wordCount: 195,
    transcript:
      "Today we'll look at how renewable energy has reshaped the electricity market over the past decade. Solar and wind together now account for approximately one third of new generating capacity worldwide, a figure that would have seemed almost impossible in twenty-fifteen. The cost of solar panels alone has fallen by more than eighty percent since twenty-ten, which has fundamentally changed the economics of building new power plants. The main challenge, however, is intermittency: when the sun does not shine and the wind does not blow, the grid still needs power, and demand does not conveniently align with supply. Three approaches are emerging to address this. The first is grid-scale battery storage, which has expanded dramatically but remains expensive at scale. The second is so-called demand response, where households and industrial users adjust their consumption in real time, often automatically, in exchange for lower tariffs. The third, and perhaps most overlooked, is interconnection: building long-distance high-voltage cables between countries so that when wind is low in Germany, surplus solar in Spain can fill the gap. Each approach has technical and political costs, and which mix dominates by twenty-thirty-five is genuinely uncertain.",
    keyPhrases: [
      "one third of new generating capacity",
      "fallen by more than eighty percent",
      "since twenty-ten",
      "intermittency",
      "grid-scale battery storage",
      "demand response",
      "long-distance high-voltage cables",
      "twenty-thirty-five"
    ]
  },
  // BBC 6 Minute English 公开节目, audioUrl 直链 BBC CDN
  ...BBC_LISTENING_ITEMS
];

export function getListeningById(id: string): ListeningItem | undefined {
  return LISTENING_ITEMS.find((l) => l.id === id);
}

export function listListeningByDifficulty(): {
  easy: ListeningItem[];
  medium: ListeningItem[];
  hard: ListeningItem[];
} {
  return {
    easy: LISTENING_ITEMS.filter((l) => l.difficulty === "easy"),
    medium: LISTENING_ITEMS.filter((l) => l.difficulty === "medium"),
    hard: LISTENING_ITEMS.filter((l) => l.difficulty === "hard")
  };
}
