export const PROMPTS = {
  pronunciation: (word: string, phonetic: string, exampleSentence: string) => `
You are an English pronunciation coach for a Chinese IELTS learner.

Word: "${word}"
Phonetic: ${phonetic}
Example: ${exampleSentence}

Return STRICT JSON, no markdown, no preface:
{
  "syllables": ["list of syllable strings"],
  "stressIndex": <0-based integer of the primary stress syllable>,
  "chineseHint": "中文读法提示, 用拼音/汉字, 简短一行",
  "commonMistakes": ["最多 3 条中文常见误读提醒"]
}
`.trim(),

  sentenceFeedback: (word: string, userSentence: string) => `
You are an IELTS writing coach. The student is practicing using a single target word in a sentence.

Target word: "${word}"
Student sentence: "${userSentence}"

Return STRICT JSON, no markdown:
{
  "grammarIssues": ["短句, 中文, 列出语法问题, 没有就空数组"],
  "moreNatural": "一句更自然/更地道的英文改写",
  "ieltsUsage": "一句可在 IELTS 写作或口语中使用的高质量例句, 必须包含目标词",
  "comments": "一段简短中文点评, 60 字以内"
}
`.trim(),

  dictationFeedback: (expected: string, got: string, kind: "word" | "sentence") => `
You are checking an IELTS student's dictation answer.

Kind: ${kind}
Correct answer: "${expected}"
Student answer: "${got}"

Return STRICT JSON:
{
  "correct": <true|false>,
  "diff": "中文一句话, 指出具体差异, 例如 漏掉 -ed 结尾 / 把 i 拼成 e",
  "memoryTip": "一条中文记忆提示, 帮助下次不再错"
}
`.trim(),

  vocabArticle: (words: Array<{ word: string; chineseMeaning: string }>) => `
You are writing a short IELTS-style passage for a Chinese learner.

Today's target words (must be naturally included, in any order):
${words.map((w) => `- ${w.word} (${w.chineseMeaning})`).join("\n")}

Constraints:
- 120 to 180 words.
- Topic must be one of: education, technology, environment, society, work, health.
- Tone: neutral, IELTS reading-style, accessible vocabulary outside the target words.
- Use each target word at least once, naturally, NOT in a list.
- Two or three short paragraphs separated by a blank line.

Return STRICT JSON:
{
  "title": "short English title",
  "topic": "one of education|technology|environment|society|work|health",
  "body": "the full passage with \\n\\n between paragraphs"
}
`.trim(),

  writingTask1: (promptText: string, essay: string) => `
You are an IELTS Academic Writing examiner grading Task 1.

Question: ${promptText}

Student essay:
"""
${essay}
"""

Return STRICT JSON, all comments in Chinese:
{
  "hasOverview": <true|false>,
  "capturesMainTrend": <true|false>,
  "dataAccuracy": <0-5>,
  "comparisonNatural": <0-5>,
  "grammarIssues": ["短句, 中文"],
  "vocabIssues": ["短句, 中文"],
  "comments": "一段总评, 中文, 120 字以内",
  "revisedVersion": "改写后的整篇英文范文, 至少 150 词, 4 段, 段间空一行",
  "highlights": [
    {
      "excerpt": "原文中要标出的精确英文片段, 必须能在 essay 里逐字找到",
      "category": "grammar | vocabulary | coherence | task_response 之一",
      "comment": "中文, 12 字以内",
      "suggestion": "建议改写, 英文, 可省",
      "severity": "info | warning | error"
    }
  ]
}

Rules for highlights:
- 至多返回 8 条;问题严重的优先
- 每条 excerpt 必须是 essay 的连续子串(逐字, 不要省略号),便于前端 indexOf 定位画下划线
- 如无明显问题可返回 []`.trim(),

  writingTask2: (promptText: string, essay: string) => `
You are an IELTS Academic Writing examiner grading Task 2.

Question: ${promptText}

Student essay:
"""
${essay}
"""

Return STRICT JSON, all comments in Chinese:
{
  "positionClear": <true|false>,
  "argumentStrength": <0-5>,
  "paragraphLogic": <0-5>,
  "vocabRepetition": <0-5>,
  "grammarIssues": ["短句, 中文"],
  "vocabIssues": ["短句, 中文"],
  "comments": "一段总评, 中文, 150 字以内",
  "revisedVersion": "改写后的整篇英文范文, 至少 250 词, 4 段, 段间空一行",
  "highlights": [
    {
      "excerpt": "原文中要标出的精确英文片段, 必须能在 essay 里逐字找到",
      "category": "grammar | vocabulary | coherence | task_response 之一",
      "comment": "中文, 12 字以内",
      "suggestion": "建议改写, 英文, 可省",
      "severity": "info | warning | error"
    }
  ]
}

Rules for highlights:
- 至多返回 8 条;问题严重的优先
- 每条 excerpt 必须是 essay 的连续子串(逐字, 不要省略号),便于前端 indexOf 定位画下划线
- 如无明显问题可返回 []`.trim(),

  newsLearning: (input: {
    title: string;
    source: string;
    publishedAt: string;
    originalSummary: string;
    url: string;
  }) => `
You are an IELTS reading and writing coach. Build a self-contained learning packet from a news headline + RSS summary, NOT from full article text.

News title: ${input.title}
Source: ${input.source}
Published at: ${input.publishedAt}
Original RSS summary (do NOT copy verbatim):
"""
${input.originalSummary}
"""

Constraints:
- learningSummary and listeningText must be your own paraphrase, IELTS reading register, NOT a copy of the original article. Stay neutral, factual, no opinion.
- vocabulary must be exactly 5 items, IELTS Band 6.5+ level. Each word should naturally appear in learningSummary or listeningText.
- readingQuestions must be exactly 3, mix of detail / inference / vocabulary-in-context. Answers in English, 1-2 sentences each.
- writingPrompt must look like an IELTS Task 2 essay question (e.g. "To what extent..." / "Discuss both views..." / "Some people think... others think...").
- Pick the single best topic among: education, technology, environment, society, health, work.

Return STRICT JSON, no markdown, no preamble:
{
  "topic": "<one of education|technology|environment|society|health|work>",
  "learningSummary": "<120-180 English words, your paraphrase, neutral factual tone>",
  "vocabulary": [
    { "word": "<English word>", "meaning": "<中文释义>", "example": "<one IELTS-style English sentence using the word>" }
  ],
  "readingQuestions": [
    { "question": "<English question>", "answer": "<English answer>" }
  ],
  "writingPrompt": "<an IELTS Task 2 question related to the topic>",
  "listeningText": "<120-180 English words, smooth for TTS reading, factual paraphrase>"
}
`.trim(),

  structureWords: (rawText: string, bookTitle: string, hint?: string) => `
You convert messy text from an IELTS vocabulary book into clean structured word entries.

Book title: ${bookTitle}
${hint ? `User hint: ${hint}` : ""}

Raw text (may contain OCR noise, page numbers, headers, mixed languages):
"""
${rawText.slice(0, 12000)}
"""

Task: Identify English vocabulary entries with their Chinese meaning, phonetic if shown, and example sentence if shown. Detect any "Day N" / "List N" / unit dividers in the raw text and use them to fill bookDay / wordList. Drop page numbers and irrelevant Chinese paragraphs.

You MUST also actively correct OCR / scanning errors:
- 英文单词:把明显错位的字母(如 'rn' 错为 'm', 'cl' 错为 'd', 数字 1/0 错为字母 l/o, 多/少字母)还原为标准拼写,例如 "def1nitlon" -> "definition", "accomodate" -> "accommodate", "enviroment" -> "environment"
- 中文释义:把扫描造成的形近字/简繁错位修正,例如 "严盧" -> "严重", "発展" -> "发展"
- 例句:同样修正显而易见的拼写/字符错误
- 如果一个候选词根本不是真实英文单词(查无此词),就跳过,不要硬塞
- 自信度低时(无法判断对错)就保留原样

Return STRICT JSON, no markdown:
{
  "words": [
    {
      "word": "<the English word, lowercase unless proper noun, already corrected>",
      "phonetic": "<IPA or empty string>",
      "chineseMeaning": "<中文释义,可能多个,用; 分隔, 已修正>",
      "englishDefinition": "<English definition or empty>",
      "exampleSentence": "<one English example or empty, 已修正>",
      "bookDay": "<e.g. Day 1, or empty>",
      "wordList": "<e.g. List A, or empty>",
      "order": <1-based integer in the order found>
    }
  ],
  "corrections": [
    {
      "from": "<原文中的乱码或错拼>",
      "to": "<你修正后的版本>",
      "reason": "<简短中文, 8 字内, 例如 OCR 错字 / 拼写错 / 形近字>"
    }
  ]
}

Rules:
- Skip duplicates (same word, lowercased).
- Skip non-vocabulary content (preface, instructions, page numbers, copyright pages).
- If you can't tell phonetic / example, use empty string, do NOT invent.
- corrections 可为空数组; 同一个修正不要重复列。
- Return at most 200 word entries and at most 50 corrections; if more, stop at the limit.
`.trim(),

  structureWordsFromImages: (bookTitle: string, hint?: string) => `
You are looking at scanned pages from an IELTS vocabulary book. Read each page CAREFULLY (include the small phonetic IPA, the Chinese gloss, and any English example sentence).

Book title: ${bookTitle}
${hint ? `User hint: ${hint}` : ""}

Task: For every English vocabulary entry visible in the images, output one structured object. The same word should appear only once across all pages. Detect any "Day N" / "List N" / unit divider visible on these pages and use it to fill bookDay / wordList for words on those pages.

Return STRICT JSON, no markdown:
{
  "words": [
    {
      "word": "<the English word, lowercase unless proper noun>",
      "phonetic": "<IPA inside / / if shown, else empty>",
      "chineseMeaning": "<中文释义,可能多个,用; 分隔>",
      "englishDefinition": "<English definition or empty>",
      "exampleSentence": "<one English example or empty>",
      "bookDay": "<e.g. Day 1, or empty>",
      "wordList": "<e.g. List A, or empty>",
      "order": <1-based integer in the order found>
    }
  ]
}

Rules:
- Skip page headers, footers, page numbers, copyright pages, prefaces, instructions.
- Only include true vocabulary entries. If a page is purely decorative (cover, ToC) return empty array for that page worth of content.
- Phonetic must look like IPA (e.g. /ˈtækl/). If unsure, leave empty rather than invent.
- Do NOT invent example sentences. If the page doesn't show one, leave empty.
- 中文释义保留原书简洁风格,例如 "v. 处理; n. 用具" 这种。
- Return at most 200 entries; if more visible, return the first 200 and stop.
`.trim()
};

export type AICapability =
  | "pronunciation"
  | "sentenceFeedback"
  | "dictationFeedback"
  | "vocabArticle"
  | "writingTask1"
  | "writingTask2"
  | "structureWords"
  | "newsLearning";
