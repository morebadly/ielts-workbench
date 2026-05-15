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
  "revisedVersion": "改写后的整篇英文范文, 至少 150 词, 4 段, 段间空一行"
}
`.trim(),

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
  "revisedVersion": "改写后的整篇英文范文, 至少 250 词, 4 段, 段间空一行"
}
`.trim(),

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

Return STRICT JSON, no markdown:
{
  "words": [
    {
      "word": "<the English word, lowercase unless proper noun>",
      "phonetic": "<IPA or empty string>",
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
- Skip duplicates (same word).
- Skip non-vocabulary content (preface, instructions, page numbers).
- If you can't tell phonetic / example, use empty string, do NOT invent.
- Return at most 200 entries; if more, return the first 200 and stop.
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
