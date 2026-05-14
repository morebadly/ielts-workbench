import type { WritingPrompt } from "@/types";

export const MOCK_WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "wp-task1-001",
    taskType: "task1",
    title: "Line Graph: Energy Consumption (2000–2020)",
    promptText:
      "The line graph below shows energy consumption per household in three countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    minWords: 150,
    recommendedMinutes: 20,
    recommendedParagraphs: 4
  },
  {
    id: "wp-task2-001",
    taskType: "task2",
    title: "Discussion: Online vs Traditional Learning",
    promptText:
      "Some people believe that online learning is as effective as traditional classroom learning, while others disagree. Discuss both views and give your own opinion. Write at least 250 words.",
    minWords: 250,
    recommendedMinutes: 40,
    recommendedParagraphs: 4
  }
];

export const MOCK_SENTENCE_DRILLS = [
  {
    id: "sd-001",
    chinese: "图表显示在线学习的人数在过去十年中显著增加。",
    suggested:
      "The chart shows that the number of online learners has increased significantly over the past decade."
  },
  {
    id: "sd-002",
    chinese: "我认为政府应该采取更严格的措施来减少空气污染。",
    suggested:
      "In my view, the government should implement stricter measures to reduce air pollution."
  }
];

export const TASK1_GUIDE = {
  title: "Task 1 范文结构",
  paragraphs: [
    {
      label: "Paragraph 1 — Introduction",
      desc: "改写题目,1–2 句话,告诉读者图表显示了什么、时间范围、单位。"
    },
    {
      label: "Paragraph 2 — Overview",
      desc: "总结主要趋势 / 最大变化 / 最明显特征。这里不写具体数字。"
    },
    {
      label: "Paragraph 3 — Details 1",
      desc: "描述第一组关键数据。重要节点、对比、起止点。"
    },
    {
      label: "Paragraph 4 — Details 2",
      desc: "描述第二组关键数据。形成对比或补充。"
    }
  ],
  rules: [
    "至少 150 词,建议 20 分钟",
    "机考建议每个段落之间空一行",
    "不要写成一整大段",
    "Overview 一定要有,雅思官方明确要求"
  ]
};

export const TASK2_GUIDE = {
  title: "Task 2 范文结构",
  paragraphs: [
    {
      label: "Paragraph 1 — Introduction",
      desc: "改写题目,并表明你的立场(同意 / 不同意 / 各有道理)。"
    },
    {
      label: "Paragraph 2 — Body 1",
      desc: "中心观点 + 解释(为什么) + 例子(具体场景)。"
    },
    {
      label: "Paragraph 3 — Body 2",
      desc: "另一个中心观点 + 解释 + 例子。注意与 Body 1 形成区分或递进。"
    },
    {
      label: "Paragraph 4 — Conclusion",
      desc: "总结立场,不要提出新观点。"
    }
  ],
  rules: [
    "至少 250 词,建议 40 分钟",
    "段落之间空一行",
    "立场必须清晰,贯穿全文",
    "每段话都要有 topic sentence"
  ]
};
