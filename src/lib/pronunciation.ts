import type { Word } from "@/types";

export interface PronunciationGuide {
  syllables: string[];
  stressIndex: number;
  chineseHint: string;
  commonMistakes: string[];
}

const STATIC_RULES: Record<string, PronunciationGuide> = {
  significant: {
    syllables: ["sig", "ni", "fi", "cant"],
    stressIndex: 1,
    chineseHint: "西-NI-非-肯特,重音在第二个音节,'NI'要拉长。",
    commonMistakes: [
      "不要把重音放在第一个音节",
      "末尾 -cant 读 /kənt/,不读 /kænt/"
    ]
  },
  fluctuate: {
    syllables: ["fluc", "tu", "ate"],
    stressIndex: 0,
    chineseHint: "FLUC-tu-eit,重音在第一个音节。",
    commonMistakes: [
      "不要把 'tu' 读成 'tjuː',这是动词,读 /tʃu/",
      "末尾 -ate 读 /eɪt/,不要读 /ət/"
    ]
  },
  approximately: {
    syllables: ["a", "pprox", "i", "mate", "ly"],
    stressIndex: 1,
    chineseHint: "ə-PROX-i-mət-li,重音在 PROX。",
    commonMistakes: ["不要读成 5 个清晰音节,词尾 -mately 要轻"]
  },
  facilitate: {
    syllables: ["fa", "cil", "i", "tate"],
    stressIndex: 1,
    chineseHint: "fə-SIL-i-teit,重音在 SIL。",
    commonMistakes: ["不要把 'cil' 读成 'kil','c' 在这里读 /s/"]
  },
  phenomenon: {
    syllables: ["phe", "nom", "e", "non"],
    stressIndex: 1,
    chineseHint: "fə-NOM-i-nən,重音在 NOM。",
    commonMistakes: ["不要把 'ph' 读成 /p/,要读 /f/"]
  }
};

function fallbackGuide(word: Word): PronunciationGuide {
  const w = word.word.toLowerCase();
  const syllables = w.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/g) || [w];
  return {
    syllables,
    stressIndex: 0,
    chineseHint: `按音节拼读:${syllables.join("-")}。重音先尝试第一个音节。`,
    commonMistakes: [
      "注意元音的长短",
      "末尾辅音不要吞掉",
      "重音音节要明显拉长 + 加重"
    ]
  };
}

export function getPronunciationGuide(word: Word): PronunciationGuide {
  const key = word.word.toLowerCase();
  return STATIC_RULES[key] || fallbackGuide(word);
}

export async function aiPronunciationGuide(_word: Word): Promise<PronunciationGuide | null> {
  return null;
}
