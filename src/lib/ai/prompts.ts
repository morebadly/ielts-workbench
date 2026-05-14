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
`.trim()
};

export type AICapability =
  | "pronunciation"
  | "sentenceFeedback"
  | "dictationFeedback"
  | "vocabArticle"
  | "writingTask1"
  | "writingTask2";
