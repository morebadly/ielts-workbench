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

  generateExample: (
    word: string,
    chineseMeaning: string,
    phonetic: string
  ) => `
You are an IELTS vocabulary tutor writing example sentences for a Chinese learner.

Target word: "${word}"
Phonetic: ${phonetic || "(unknown)"}
Chinese meaning: ${chineseMeaning}

Return STRICT JSON, no markdown, no preface:
{
  "exampleSentence": "one natural English sentence at IELTS level (band 6.5-7.5), 12-22 words, MUST contain the target word in its base sense",
  "exampleTranslation": "对应的中文翻译, 简洁地道",
  "memoryTip": "一句中文助记/词根/搭配提示, 30 字以内"
}

Rules:
- The sentence should sound like academic / formal English suitable for IELTS Writing or Speaking, not childish.
- Do NOT use rare or obscure collocations; pick the most common natural usage.
- If the target word is a verb, conjugate naturally (past/present/etc.)
- Do not wrap in any code fence.
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

  askWord: (token: string) => `
Look up the English word or short phrase: "${token}"

Return STRICT JSON, no markdown, no extra text:
{
  "word": "<lowercase normalized form>",
  "phonetic": "<IPA in slashes, e.g. /təˈmɒrəʊ/, prefer British; empty if uncertain>",
  "phoneticUS": "<American IPA if notably different, else empty>",
  "partOfSpeech": "<n. / v. / adj. / adv. / phrase / etc.>",
  "chineseMeaning": "<中文释义,可有多个义项,用; 分隔>",
  "englishDefinition": "<concise English definition, one sentence>",
  "exampleSentence": "<one natural English example sentence in IELTS style>",
  "exampleTranslation": "<例句的中文翻译>",
  "synonyms": ["<近义词1>", "<近义词2>"],
  "antonyms": ["<反义词1>"],
  "isIeltsCommon": <true | false>,
  "ieltsBand": "<估计的雅思考频:5-6 / 6-7 / 7+ / unclear>",
  "collocations": ["<常见搭配, 例如 'tackle a problem'>"]
}

Rules:
- 如果输入根本不是英文单词或短语(纯中文/乱码/无意义),返回 {"error":"not_a_word"}。
- synonyms / antonyms / collocations 各最多 3 条,没有就返回空数组。
- isIeltsCommon=true 表示这是雅思考试的高频词或必备词。
- 不要编造你不确定的内容(例如不确定的 phonetic 就返回空字符串)。
`.trim(),

  askChat: (history: Array<{ role: "user" | "assistant"; content: string }>) => `
You are an IELTS English tutor for a Chinese learner. Give short, clear, supportive replies.

Conversation so far:
${history
    .map((m) => `${m.role === "user" ? "User" : "Tutor"}: ${m.content}`)
    .join("\n")}

Answer the latest user message. Rules:
- 默认中文回答(因为用户母语是中文),专有名词、英文例句、术语保留英文。
- 如果用户问翻译、语法、写作改写,先给答案再给一句简短解释。
- 引用例句时用英文,并附中文翻译。
- 不要超过 250 字。
- 如果用户问"这个单词什么意思",说明请用单独按钮查询 (这条只在你认为是简单查词时温和提一句)。
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
- 中文释义保留原书简洁风格,例如 "v. 处理; n. 用具" 这种。**词性必须保留**, 例如 "波动" 必须写成 "v. 波动" 而不是裸 "波动"。
- Return at most 200 entries; if more visible, return the first 200 and stop.
`.trim(),

  /**
   * v1.10.3: 给一个英文词补"词性 + 中文释义",用于已存量词条缺词性的批量修复
   * 输入只需要 word + 当前的 chineseMeaning, 输出带词性前缀的标准格式
   */
  posLookup: (word: string, currentMeaning: string) => `
You are an IELTS bilingual lexicographer. Given an English word and its current Chinese meaning (which may be missing its part-of-speech prefix), return the standard form.

Word: "${word}"
Current Chinese meaning: "${currentMeaning}"

Return STRICT JSON, no markdown:
{
  "partOfSpeech": "<one or more of n. | v. | adj. | adv. | prep. | conj. | phrase, comma-separated if multiple, e.g. 'v., n.'>",
  "refinedMeaning": "<把词性放在前面,中文释义跟在后面;多个词性时按 'v. xxx; n. yyy' 风格分号分隔。已修正错别字, 简洁地道, 保持原义不扩展>"
}

Rules:
- 如果 currentMeaning 已经包含正确词性(例如以 "v. " / "n. " / "adj. " 开头),保留原词性不变, 只清理空格 / 标点
- 如果完全缺词性, 根据 word 在该 meaning 下最常见的词性自动补
- 如果一个词在 IELTS 里同时是动词和名词且 currentMeaning 含两层意思, 用 "v. xxx; n. yyy" 形式
- 中文释义保持原书风格, 不展开, 不替换为别的同义释义。如果原 meaning 完全错或乱码, 才纠正
- 不要返回任何额外文本, 不要 markdown
`.trim()
};

export type AICapability =
  | "pronunciation"
  | "sentenceFeedback"
  | "dictationFeedback"
  | "vocabArticle"
  | "generateExample"
  | "posLookup"
  | "writingTask1"
  | "writingTask2"
  | "structureWords"
  | "newsLearning";
