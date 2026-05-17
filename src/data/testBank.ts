import type { TestBankItem } from "@/types";

/**
 * 真题题库 mock 数据
 *
 * 现状: 1 套占位 demo, 内容**完全自写**, 不含任何剑桥/IELTS 官方原文。
 * UI 会按 isMock=true 在卡片上标 "DEMO 占位", 提醒这是骨架不是真题。
 *
 * 等 LLM 额度回来后, 用 scripts/extract-cambridge.mjs 替换为剑20 Test 1 真数据,
 * 同时把 isMock 改 false, audioPath 指向部署在服务器的 /audio/cb20-9f3a/ 下的 mp3。
 */
export const TEST_BANK: TestBankItem[] = [
  {
    id: "cb20-test1",
    name: "剑20 Test 1",
    source: "cambridge",
    subtitle: "2024 年最新 (DEMO 占位中)",
    isMock: true,
    reading: [
      {
        id: "cb20-t1-r1",
        order: 1,
        title: "Urban Green Spaces: A Modern Necessity",
        body: `A. In recent decades, the concept of urban green space has shifted from a peripheral concern to a central pillar of city planning. While public parks and tree-lined avenues have existed for centuries, contemporary planners now treat green areas as essential infrastructure, comparable to roads or sewage systems. This change reflects a growing body of research linking exposure to nature with measurable improvements in physical health, mental well-being, and even social cohesion.

B. One of the earliest large-scale studies on the topic was conducted in the Netherlands in 2009. Researchers tracked the medical records of more than 250,000 residents and discovered that those living within one kilometre of a green space reported significantly lower rates of depression, anxiety, and cardiovascular disease. The effect was strongest in densely populated neighbourhoods, where access to nature was otherwise limited. Crucially, the relationship persisted even after controlling for income and education.

C. The economic case for urban greenery is also compelling. A 2017 analysis by the city of Melbourne estimated that its existing tree canopy contributes the equivalent of 28 million Australian dollars annually through cooling, air purification, and stormwater management. As global temperatures rise, the cooling effect alone is becoming increasingly valuable. Asphalt and concrete absorb heat during the day and release it slowly at night, creating what is known as the urban heat island effect. Trees, by contrast, lower local temperatures by several degrees through shade and evapotranspiration.

D. Yet not all green spaces are equally beneficial. A common pitfall in urban planning is the assumption that any patch of grass will deliver the full range of benefits. In practice, large monocultural lawns, while visually pleasant, support little biodiversity and require extensive watering and chemical treatment. Conversely, small but ecologically rich pockets of native vegetation can outperform much larger conventional parks in terms of carbon sequestration and wildlife habitat.

E. The challenge of integrating green space into already dense cities has produced a range of inventive solutions. Singapore, often cited as a pioneer, has mandated that new developments replace the green area lost at ground level with vertical gardens, sky terraces, or rooftop parks. Tokyo has experimented with miniature pocket parks tucked between buildings, while Copenhagen has converted disused industrial harbours into public swimming areas. These projects share an underlying logic: in a crowded city, every horizontal and vertical surface is a candidate for greening.

F. However, equity remains a persistent issue. In many cities, wealthier neighbourhoods enjoy disproportionately greater access to high-quality parks. A 2021 study of 28 American metropolitan regions found that white residents had access to 70 percent more park acreage per capita than residents of colour. Bridging this gap requires not only new investment but also a willingness to redirect existing resources towards historically underserved areas, a politically delicate task.

G. Looking ahead, the most ambitious vision belongs to those advocating for the so-called sponge city. Originating in China and now spreading internationally, the concept reimagines urban surfaces as porous, allowing rainwater to filter into the ground rather than running off into storm drains. Permeable pavements, bioswales, and rain gardens form the backbone of this approach. If widely adopted, sponge cities could simultaneously reduce flooding, recharge groundwater, and provide the kind of richly vegetated landscape that earlier eras of urban planning systematically erased.`,
        groups: [
          {
            id: "g1",
            range: "Questions 1-5",
            instruction:
              "Do the following statements agree with the information given in Reading Passage 1? Write TRUE / FALSE / NOT GIVEN.",
            type: "tfng",
            questions: [
              {
                id: "q1",
                number: 1,
                type: "tfng",
                prompt: "Urban green spaces have only recently become part of city planning.",
                answer: "FALSE"
              },
              {
                id: "q2",
                number: 2,
                type: "tfng",
                prompt:
                  "The 2009 Dutch study found that the link between green space and health weakened in poorer areas.",
                answer: "FALSE"
              },
              {
                id: "q3",
                number: 3,
                type: "tfng",
                prompt: "Melbourne's tree canopy delivers measurable financial benefits.",
                answer: "TRUE"
              },
              {
                id: "q4",
                number: 4,
                type: "tfng",
                prompt: "Large lawns are an effective way to support local biodiversity.",
                answer: "FALSE"
              },
              {
                id: "q5",
                number: 5,
                type: "tfng",
                prompt: "All major cities have committed to sponge city principles.",
                answer: "NOT GIVEN"
              }
            ]
          },
          {
            id: "g2",
            range: "Questions 6-9",
            instruction:
              "Match each city with the green-space approach it has adopted.",
            type: "matchFeatures",
            sharedOptions: [
              "A. Vertical gardens replacing lost ground-level greenery",
              "B. Pocket parks between buildings",
              "C. Converting industrial sites into recreational water areas",
              "D. Outlawing all asphalt paving",
              "E. Mandatory rooftop farms in residential blocks"
            ],
            questions: [
              {
                id: "q6",
                number: 6,
                type: "matchFeatures",
                prompt: "Singapore",
                answer: "A"
              },
              {
                id: "q7",
                number: 7,
                type: "matchFeatures",
                prompt: "Tokyo",
                answer: "B"
              },
              {
                id: "q8",
                number: 8,
                type: "matchFeatures",
                prompt: "Copenhagen",
                answer: "C"
              },
              {
                id: "q9",
                number: 9,
                type: "matchFeatures",
                prompt: "An emerging model originating in China",
                answer: "D",
                wordLimit: "Choose the closest match (DEMO 占位题, 答案设为 D 仅作交互演示)"
              }
            ]
          },
          {
            id: "g3",
            range: "Questions 10-13",
            instruction:
              "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
            type: "sentenceComplete",
            questions: [
              {
                id: "q10",
                number: 10,
                type: "sentenceComplete",
                prompt:
                  "The phenomenon by which built-up areas become hotter than their surroundings is called the ____ effect.",
                answer: "urban heat island",
                wordLimit: "NO MORE THAN THREE WORDS"
              },
              {
                id: "q11",
                number: 11,
                type: "sentenceComplete",
                prompt: "Trees lower temperatures by providing shade and through ____.",
                answer: "evapotranspiration",
                wordLimit: "NO MORE THAN TWO WORDS"
              },
              {
                id: "q12",
                number: 12,
                type: "sentenceComplete",
                prompt:
                  "A 2021 American study found that white residents had access to 70 percent more ____ per person.",
                answer: "park acreage",
                wordLimit: "NO MORE THAN TWO WORDS"
              },
              {
                id: "q13",
                number: 13,
                type: "sentenceComplete",
                prompt:
                  "Sponge cities use permeable pavements, bioswales and ____ to manage rainwater.",
                answer: "rain gardens",
                wordLimit: "NO MORE THAN TWO WORDS"
              }
            ]
          }
        ]
      }
    ],
    listening: [
      {
        id: "cb20-t1-l1",
        order: 1,
        title: "Section 1: Library Membership Application",
        audioPath: "cb20-9f3a/T1-P1.mp3",
        transcript: `OFFICER: Good afternoon. How can I help you?
APPLICANT: Hi, I'd like to register for a library card, please.
OFFICER: Of course. Could I take your full name?
APPLICANT: Yes, it's Sophie Andersen. That's A-N-D-E-R-S-E-N.
OFFICER: Thank you. And your date of birth?
APPLICANT: The fifteenth of August, 1998.
OFFICER: And the address where you're currently living?
APPLICANT: Flat 4B, 27 Riverside Road. The postcode is BS8 2QD.
OFFICER: Lovely. We have three membership types. Standard is free for residents and gives you up to ten loans at once. The Plus card is twenty-five pounds a year and increases that to twenty loans, plus access to our online journals. The Premium card is sixty-five pounds and adds free room booking.
APPLICANT: I think I'll go for the Plus, since I do quite a lot of academic reading.
OFFICER: Good choice. The standard loan period is three weeks for books and one week for DVDs. Late returns are charged at twenty pence per day. Now, do you have proof of address with you?
APPLICANT: Yes, I have a recent utility bill.
OFFICER: Perfect. Your card will be ready in about five minutes.`,
        groups: [
          {
            id: "lg1",
            range: "Questions 1-5",
            instruction:
              "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
            type: "formComplete",
            questions: [
              {
                id: "lq1",
                number: 1,
                type: "formComplete",
                prompt: "Surname:",
                answer: "Andersen",
                wordLimit: "ONE WORD"
              },
              {
                id: "lq2",
                number: 2,
                type: "formComplete",
                prompt: "Date of birth: 15 ____ 1998",
                answer: "August",
                wordLimit: "ONE WORD"
              },
              {
                id: "lq3",
                number: 3,
                type: "formComplete",
                prompt: "Address: Flat 4B, 27 ____ Road",
                answer: "Riverside",
                wordLimit: "ONE WORD"
              },
              {
                id: "lq4",
                number: 4,
                type: "formComplete",
                prompt: "Postcode:",
                answer: "BS8 2QD",
                wordLimit: "ONE WORD AND A NUMBER"
              },
              {
                id: "lq5",
                number: 5,
                type: "formComplete",
                prompt: "Membership type:",
                answer: "Plus"
              }
            ]
          },
          {
            id: "lg2",
            range: "Questions 6-10",
            instruction:
              "Complete the table. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
            type: "tableComplete",
            questions: [
              {
                id: "lq6",
                number: 6,
                type: "tableComplete",
                prompt: "Standard membership: maximum ____ loans at once",
                answer: "ten"
              },
              {
                id: "lq7",
                number: 7,
                type: "tableComplete",
                prompt: "Plus membership: ____ pounds per year",
                answer: "25"
              },
              {
                id: "lq8",
                number: 8,
                type: "tableComplete",
                prompt: "Premium membership extra benefit: free ____",
                answer: "room booking",
                wordLimit: "TWO WORDS"
              },
              {
                id: "lq9",
                number: 9,
                type: "tableComplete",
                prompt: "Loan period for books: ____ weeks",
                answer: "three"
              },
              {
                id: "lq10",
                number: 10,
                type: "tableComplete",
                prompt: "Late return fee: ____ pence per day",
                answer: "20"
              }
            ]
          }
        ]
      }
    ]
  }
];

export function getTestById(id: string): TestBankItem | undefined {
  return TEST_BANK.find((t) => t.id === id);
}
