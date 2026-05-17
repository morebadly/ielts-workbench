import type { ListeningItem } from "@/types";

/**
 * BBC Learning English - 6 Minute English 集录
 *
 * 来源全部为公开节目, transcript 由 BBC 官方提供, audioUrl 直接命中 BBC 的
 * downloads.bbc.co.uk CDN, 不在本站服务器存储任何 mp3。
 *
 * 难度: 6 Minute English 整体定位 B1 (intermediate), 接近 IELTS 听力 5.0-6.5,
 * 适合 Section 3-4 学术讨论训练。每集约 6 分钟, 600-900 词。
 *
 * 字段约定:
 * - audioUrl: 必填, 命中 BBC 公开 mp3 直链
 * - transcript: 节录 introduction + 主体对话 + ending vocabulary recap
 *   (BBC 原文是 "not a word-for-word transcript", 我们再做了适度精简)
 * - keyPhrases: 用 BBC 原文 vocabulary 部分的核心词组, 听力题常考
 * - section: 标 3 因为是双人讨论 + 嘉宾访谈, 跟 IELTS Section 3 对话风格最像
 */
export const BBC_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "bbc-250911-hearing",
    title: "BBC 6 Min · What causes hearing loss?",
    audioUrl:
      "https://downloads.bbc.co.uk/learningenglish/features/6min/250911_6_minute_english_what_causes_hearing_loss_download.mp3",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le",
    wordCount: 720,
    transcript: `Neil: Hello, this is 6 Minute English from BBC Learning English. I'm Neil.
Georgie: And I'm Georgie. As we get older, many of us notice our sense of hearing getting worse. Maybe we need to concentrate harder or ask people to speak more loudly. Has that happened to you, Neil?
Neil: Not really. A while ago I thought maybe my ears were getting worse, but I had a check-up and everything was fine, thankfully.
Georgie: In the UK alone, hearing loss affects 18 million people and that number is increasing. In this programme, we'll discover why we lose hearing with age.
Neil: I have a question for you, Georgie. The three smallest bones in the human body — the hammer, the anvil, and the stirrup — are all located in the ear. But which one of those is the smallest?
Georgie: Hmm. I'm going to say the anvil bone.
Neil: OK. We'll find out the answer later. To understand why our hearing gets worse with age, here's Mr Nish Mehta, an ear, nose and throat surgeon at Royal National ENT Hospital in London:
Nish Mehta: Sound enters the outer ear, travels down the ear canal, and hits the eardrum. The eardrum vibrates and these vibrations are transferred through three tiny bones in the middle ear to the cochlea, which is filled with fluid and tiny hair cells. These hair cells convert the vibrations into electrical signals that the brain understands as sound.
Georgie: So the hair cells in the cochlea are crucial. The problem is, as we age, these hair cells slowly die off and they cannot regenerate. This is called presbycusis — age-related hearing loss.
Neil: Loud noise is another major cause. Listening to loud music through headphones for hours every day can damage these hair cells permanently. It's a downward spiral — once damaged, they're gone for good.
Georgie: That's worrying for anyone who works in noisy environments or attends concerts regularly. Are there any treatments?
Neil: Hearing aids amplify sound, while cochlear implants can directly stimulate the auditory nerve. But prevention is best — protect your ears from loud noise.
Georgie: And the answer to your question, Neil?
Neil: The smallest bone is c) the stirrup, also called the stapes. It's only about three millimetres long.
Georgie: Let's recap our vocabulary: presbycusis means age-related hearing loss; hair cells in the cochlea convert vibrations into signals; a downward spiral is a situation that continuously gets worse.`,
    keyPhrases: [
      "hearing loss affects 18 million people",
      "ear, nose and throat surgeon",
      "vibrations transferred through three tiny bones",
      "hair cells in the cochlea",
      "presbycusis",
      "downward spiral",
      "cochlear implants",
      "stapes / stirrup bone"
    ]
  },
  {
    id: "bbc-250508-zoos",
    title: "BBC 6 Min · Should animals be kept in zoos?",
    audioUrl:
      "https://downloads.bbc.co.uk/learningenglish/features/6min/250508_6_minute_english_should_animals_be_kept_in_zoos_download.mp3",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le",
    wordCount: 740,
    transcript: `Neil: Hello, this is 6 Minute English. I'm Neil.
Georgie: And I'm Georgie. For some, zoos are a good way to teach people about nature and save endangered species from extinction. Others think separating animals from their natural habitat is cruel and unnecessary.
Neil: With an estimated 700 million visitors every year, zoos remain popular — but are they a good thing? Now, I have a question for you, Georgie. In 2022, five animals escaped from Sydney's Taronga Zoo in Australia. Were the escaped animals: a) elephants, b) lions, or c) zebras?
Georgie: Hmm. I can imagine zebras running away from the zoo.
Neil: OK. We'll find out later. Reporter William Lee Adams has been investigating the arguments for and against keeping animals in zoos:
William Lee Adams: Education is the primary reason that zoos give for why they should exist. School children all over the world are bussed to zoos. The point is to introduce them to conservation. A second point is that zoos often invest in research programmes that help endangered animals. Pandas, for example, are notoriously reluctant to mate.
Georgie: One argument is education about conservation: protecting plants, animals and the natural world from human damage. Another is research, including breeding programmes for endangered species.
Neil: But there are arguments against. Critics say zoo enclosures, no matter how big, can never replicate an animal's natural habitat. Animals can develop stereotypic behaviours — repetitive movements like pacing — which signal psychological distress.
Georgie: Some species, particularly intelligent ones like elephants and orcas, suffer disproportionately. They have huge home ranges in the wild and complex social structures.
Neil: There's also a question of finance. Zoos are expensive to run, and critics argue the money would be better spent protecting habitats in the wild.
Georgie: It seems the debate is far from over. Both sides have valid points.
Neil: And the answer to my question?
Georgie: I said zebras.
Neil: Sorry Georgie, the answer was b) lions. Five lions escaped from their enclosure but were quickly recaptured. Let's recap: conservation means protecting nature; reluctant means unwilling; stereotypic behaviour is repetitive movement signalling stress.`,
    keyPhrases: [
      "save endangered species from extinction",
      "natural habitat",
      "conservation",
      "reluctant to mate",
      "breeding programmes",
      "stereotypic behaviours",
      "home ranges in the wild",
      "five lions escaped"
    ]
  },
  {
    id: "bbc-250612-climate-mental",
    title: "BBC 6 Min · Climate change and mental health",
    audioUrl:
      "https://downloads.bbc.co.uk/learningenglish/features/6min/250612_6_minute_english_can_climate_change_affect_our_mental_health_download.mp3",
    section: 3,
    scenario: "discussion",
    difficulty: "hard",
    attribution: "bbc_le",
    wordCount: 760,
    transcript: `Beth: Hello and welcome to 6 Minute English. I'm Beth.
Neil: And I'm Neil. Today we're going to talk about climate change and how it can affect people's mental health. Natural disasters and the impacts of climate change can be stressful.
Beth: In today's episode we'll find out how people can protect their mental health from the impacts of climate change. We'll be hearing from a psychiatry expert and a man who survived a wildfire and helped rebuild his town.
Neil: But first, Beth, I have a question for you. In January 2025, big wildfires affected big parts of Los Angeles. According to research organisation World Weather Attribution, human-caused climate change made the fires: a) 10% more likely, b) 35% more likely, or c) 20% less likely?
Beth: I'm going to say 10% more likely.
Neil: OK, we'll find out later. Now, natural disasters like floods and wildfires can destroy homes and communities. People who live in affected areas can experience climate trauma — the very bad and long-lasting emotional effects of an event.
Beth: Professor Jyoti Mishra is an expert in climate trauma at the University of California:
Jyoti Mishra: Climate trauma is not an individual trauma — it's a community-wide trauma which really affects collective well-being. Having a strong community helps reduce or heal trauma. Part of the solution is how communities rebuild and reconnect together.
Neil: So community is crucial. After Paradise, California, was destroyed by wildfire in 2018, residents had to rebuild from scratch. One of them, Phil John, runs a coffee shop:
Phil John: It's been a long road. People who came back, we share something — we share the loss but also the rebuilding. There's a real sense of belonging. We look out for each other in a way that's hard to explain unless you've lived through it.
Beth: That sense of belonging — feeling part of a group — can protect mental health after trauma.
Neil: It seems the answer isn't just individual therapy, but rebuilding community ties. And the answer to my question?
Beth: I said 10% more likely.
Neil: Actually it was b) 35% more likely. Climate change made the LA wildfires significantly more likely. Let's recap: trauma is long-lasting emotional damage; sense of belonging is feeling part of a community; collective well-being refers to the health of a whole group rather than just individuals.`,
    keyPhrases: [
      "natural disasters can destroy homes and communities",
      "climate trauma",
      "community-wide trauma",
      "collective well-being",
      "rebuild from scratch",
      "sense of belonging",
      "look out for each other",
      "35% more likely"
    ]
  },
  {
    id: "bbc-250327-immune",
    title: "BBC 6 Min · Can we boost the immune system?",
    audioUrl:
      "https://downloads.bbc.co.uk/learningenglish/features/6min/250327_6_minute_english_can_we_boost_the_immune_system_download.mp3",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le",
    wordCount: 700,
    transcript: `Georgie: Hello, this is 6 Minute English. I'm Georgie.
Neil: And I'm Neil. In this programme we're talking about the immune system, the body's natural defence against getting ill. Now, Georgie, is there anything you do to boost your immune system?
Georgie: Yes. I try to eat lots of oranges, which apparently have lots of vitamin C. There are lots of things people do to try to improve their immune system — eating certain foods, taking vitamins, even swimming in cold water.
Neil: But first, a question for you. The common cold makes you cough and sneeze, have a sore throat and headache. How many colds does the average adult get in the UK each year? Is it: a) 2-3, b) 4-5, or c) 7-8?
Georgie: I'm going to go with a) 2-3 colds a year.
Neil: We'll find out at the end. Host of BBC Radio 4 programme Inside Health, James Gallagher, gathered some experts to talk about immune systems:
James Gallagher: How has everyone been this winter? Because I've had a rotten one and I have felt constantly ill since November. John?
John Tregoning: I have not had anything yet, touch wood.
Georgie: When John says "touch wood", he's expressing the hope that his good luck will continue. Many people knock on a wooden surface when saying this — it's a superstition.
Neil: Now, do all those things people do to boost immunity actually work? Margaret McCartney, a GP and academic, gave her view:
Margaret McCartney: There's actually no good evidence that ginger shots, turmeric supplements, or cold water swimming change your immune system in a meaningful way. The basics — sleep, exercise, balanced diet, vaccinations — those are what matter.
Georgie: So most "immune-boosting" products are pretty much hype. The boring advice — sleep well, eat well, get vaccinated — is what actually works.
Neil: And the answer to my question, Georgie?
Georgie: I said 2-3 colds a year.
Neil: That's correct! The average UK adult gets 2-3 colds a year. Let's recap: touch wood is a superstition for continued good luck; pretty much means almost completely; hype is exaggerated promotional material.`,
    keyPhrases: [
      "natural defence against getting ill",
      "boost your immune system",
      "swimming in cold water",
      "ginger shots, turmeric supplements",
      "cough and sneeze, sore throat",
      "touch wood",
      "balanced diet",
      "2-3 colds a year"
    ]
  },
  {
    id: "bbc-250102-water",
    title: "BBC 6 Min · Are you drinking enough water?",
    audioUrl:
      "https://downloads.bbc.co.uk/learningenglish/features/6min/250102_6_minute_english_are_you_drinking_enough_water_download.mp3",
    section: 3,
    scenario: "discussion",
    difficulty: "easy",
    attribution: "bbc_le",
    wordCount: 680,
    transcript: `Phil: Hello. This is 6 Minute English. I'm Phil.
Beth: And I'm Beth. Nowadays, I often see people carrying water bottles with them to make sure they drink enough. How much water do you drink a day, Phil?
Phil: Oh, I don't know. Maybe about a litre?
Beth: And do you know how much water you should drink a day?
Phil: I think it's probably about two litres.
Beth: The number many people have heard is two litres a day. Of course, everyone needs to drink some water — over half the human body is made up of it. But exactly how much do we need?
Phil: First, a question. Over half the human body consists of water, but there's an even higher percentage in our blood. How much? Is our blood: a) around 80% water, b) around 90% water, or c) 100% water?
Beth: I think it's around 80%.
Phil: We'll reveal the answer later. The amount recommended is often given as two litres a day. But why? Here's biologist Professor John Speakman:
Professor John Speakman: I'm not sure how it was arrived at, but it seems to be a number that has taken grip on a very large number of people, including governments. Almost all governments recommend two litres of water per day, but there is no scientific evidence supporting this specific amount.
Beth: So when Professor Speakman says the two-litre figure has "taken grip", he means it's become widely accepted, even though there's no real evidence for it. He's not sure how it was arrived at — meaning he doesn't know how the number was first decided.
Phil: A more useful idea is dehydration — when your body doesn't have enough water. Hydration expert Dridia Rodriguez-Sanchez explains its symptoms:
Dridia Rodriguez-Sanchez: When you start to feel tired, hungry, weak — those are early symptoms of dehydration. Your body actually signals thirst before you consciously notice it. The pretty much universal advice is: when you feel thirsty, drink. Don't try to hit a fixed ballpark figure.
Beth: A symptom is something you feel in your body that suggests an illness. A ballpark figure is an estimate that's roughly right but not precise.
Phil: So forget the two litres — listen to your body. And the answer?
Beth: I said 80%.
Phil: It's actually closer to b) 90% water in our blood. Let's recap: arrive at means reach a conclusion; take grip means become widely accepted; symptom is a sign of illness; ballpark figure is a rough estimate.`,
    keyPhrases: [
      "carrying water bottles",
      "two litres a day",
      "no scientific evidence",
      "arrived at",
      "taken grip",
      "dehydration",
      "symptom",
      "ballpark figure",
      "around 90% water"
    ]
  }
];
