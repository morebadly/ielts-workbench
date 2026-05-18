import type { ListeningItem } from "@/types";

/**
 * BBC Learning English - 6 Minute English 集录
 *
 * 来源全部为公开节目, transcript 由 BBC 官方提供。
 *
 * ⚠️ 关于 mp3:
 * BBC podcast 只保留最近 30 天的 mp3 直链, 旧集次的 mp3 会被下架。
 * 所以这里所有 audioUrl 留空, 走站内 MiniMax TTS 朗读 transcript。
 * UI 上 attribution = "bbc_le_transcript", 明确标 "BBC 原文 · AI 朗读" 避免误导。
 *
 * 等以后做"近期 BBC 集次自动收录"功能 (扫 BBC 节目页, 抓最近 30 天 mp3),
 * 那批集次可以用 attribution = "bbc_le" + audioUrl 真音频。
 *
 * 难度: 6 Minute English 整体定位 B1 (intermediate), 接近 IELTS 听力 5.0-6.5,
 * 适合 Section 3-4 学术讨论训练。每集约 6 分钟, 600-900 词。
 */
export const BBC_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "bbc-250911-hearing",
    title: "BBC 6 Min · What causes hearing loss?",
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le_transcript",
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
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le_transcript",
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
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "hard",
    attribution: "bbc_le_transcript",
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
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le_transcript",
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
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "easy",
    attribution: "bbc_le_transcript",
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
  },
  {
    id: "bbc-241031-sleep",
    title: "BBC 6 Min · Why you need a good night's sleep",
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le_transcript",
    wordCount: 700,
    transcript: `Georgie: Hello, this is 6 Minute English from BBC Learning English. I'm Georgie, and we're ready to start, Phil... Phil?!
Phil: Oh, sorry, Georgie, I was er, just catching forty winks... you know, getting some shut-eye, dozing, taking a nap... I was sleeping!
Georgie: Sleeping at work! Phil, how could you?
Phil: I know, I know. Sorry, I didn't sleep well last night.
Georgie: I'll forgive you this time, but make sure you go to bed early tonight because getting a good night's sleep is incredibly important. Did you know that people who get enough sleep live about five years longer than people who don't?
Phil: Wow, so a good night's sleep can lengthen your life. In this programme, we'll be finding out more about the benefits of sleep.
Georgie: But first, a question for you. Do you know how much of the average person's life is spent asleep? Is it: a) a half, b) a quarter, or c) a third?
Phil: Hmm, I think we spend about a third of our lives sleeping.
Georgie: I'll reveal the answer at the end. Why do humans sleep at all? In terms of evolution, why would it make sense to go unconscious every night, leaving yourself vulnerable to danger? Here's science journalist Ginny Smith on BBC Radio 4's Inside Science:
Ginny Smith: We've all experienced this — if you've been struggling with a problem, sometimes you sleep on it and the answer is there in the morning. The brain is consolidating memories, moving information from short-term to long-term storage, and even working through problems while you sleep.
Phil: So when Ginny says we sleep on it, she means we leave a problem until morning to think about it more clearly. The brain consolidates information, meaning it strengthens memories and stores them more permanently.
Georgie: But what happens if you don't get enough sleep? Sleep deprivation isn't just feeling tired — it's a form of stress on the body.
Ginny Smith: Sleep deprivation activates the body's fight-or-flight response. Cortisol levels go up, the immune system is suppressed, and over time this can lead to serious health problems.
Phil: The fight-or-flight response is the body's natural reaction to threat — it prepares you to either fight or run away. The problem is, when you're constantly tired, your body acts as if it's always under threat.
Georgie: And the answer to my question, Phil?
Phil: I said a third.
Georgie: Correct! Humans spend about a third of their lives asleep. Let's recap: catching forty winks means having a short sleep; sleep on it means leave a problem until morning; consolidate means strengthen and combine; fight-or-flight is the body's stress response.`,
    keyPhrases: [
      "catching forty winks",
      "getting some shut-eye",
      "live about five years longer",
      "sleep on it",
      "consolidating memories",
      "short-term to long-term storage",
      "sleep deprivation",
      "fight-or-flight response",
      "a third of our lives asleep"
    ]
  },
  {
    id: "bbc-250605-politeness",
    title: "BBC 6 Min · How important is politeness?",
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le_transcript",
    wordCount: 720,
    transcript: `Neil: Hello, this is 6 Minute English. I'm Neil.
Beth: And I'm Beth. In this programme, we're talking about politeness. Britain has a reputation for being a polite place where children are told to say "please" and "thank you", but in real life that isn't always true. You, give me that pen!
Neil: I'm sorry. That was a bit rude.
Beth: Well, what should I have said?
Neil: How about: "Neil, please could you pass me the pen?"
Beth: Listen as BBC Radio 4 presenter Michael Rosen, a well-known poet and children's author, describes what happened to him one day:
Michael Rosen: Recently, this is how it went: a boy was walking past me in the street, stopped and said, "Hey! You're thingy, innit!" Now, that one seems to break all the rules. And because it broke the rules, it gave me a problem. How do I answer it?
Beth: A boy used the word thingy because, although he recognised Michael, he couldn't remember his name. He also said innit, short for "isn't it", to add emphasis.
Neil: Was the boy being impolite, or just happy to meet a famous person? Why do we teach kids to be polite in the first place? Question for you, Beth — there's an idiom we use to remind someone to be especially polite. Is it: a) mind your As and Bs, b) mind your Ps and Qs, or c) mind your Xs and Ys?
Beth: I'll go with c) Xs and Ys.
Neil: We'll find out later. Professor Louise Mullany studies the language of politeness. She thinks politeness is about the listener as much as the speaker:
Louise Mullany: The crucial thing there is in how you've perceived it. Obviously he's not giving us the conventional, "Oh, good afternoon, Mr Rosen." It's very informal, but you don't see him as insulting you. You're actually quite kindly disposed to that person. So you haven't interpreted it as offensive.
Beth: Michael didn't feel insulted. To insult someone means to be rude or offensive. Michael was well disposed to the boy — he liked and approved of him.
Neil: So if Michael isn't offended, where is the offence? Why teach children to be polite at all?
Louise Mullany: My two-year-old daughter repeatedly ignored the cook at her nursery school and refused to say hello. We started to make excuses for her — "Oh, she's tired. Oh, she's teething. She's this and that." Because the embarrassment was so strong.
Beth: When her daughter didn't say hello, Louise made excuses for her — explaining the reasons for behaviour. The phrase this and that describes various unspecified things.
Neil: Time for the answer.
Beth: I said Xs and Ys.
Neil: Sorry — it's b) mind your Ps and Qs. Recap: thingy is informal for someone whose name you can't remember; innit is short for "isn't it"; insulting means rude or offensive; well disposed to means liking and approving of someone; make excuses for is explaining bad behaviour.`,
    keyPhrases: [
      "Britain has a reputation for being polite",
      "thingy",
      "innit",
      "break all the rules",
      "well disposed to",
      "make excuses for",
      "mind your Ps and Qs",
      "this and that"
    ]
  },
  {
    id: "bbc-250703-sorry",
    title: "BBC 6 Min · How do you say sorry?",
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le_transcript",
    wordCount: 740,
    transcript: `Neil: Hello, this is 6 Minute English. I'm Neil.
Beth: And I'm Beth.
Neil: In English there are many ways to apologise. In formal situations you could say "Please forgive me," while to a friend you might say "My bad." And there's the most common phrase: "I'm sorry." Can you remember a time when you had to apologise, Beth?
Beth: I had to apologise this morning because I stepped on someone's toes on the tube.
Neil: OK. Apologising depends on what you've done. Sorry is fine if you accidentally step on someone's toes. But what if you do something really serious, like the Ghanaian journalist Afia Pokua, who publicly criticised the King of the Ashanti tribe? Here's BBC World Service programme The Fifth Floor:
Faranak Amidi: It's not every day that you end up offending a king, but let's say you did. Would you know how to apologise to him? Recently in Ghana, a journalist made some comments on television about the King of the Ashanti tribe, and soon she found herself at his palace apologising.
Beth: The presenter says, "It's not every day that you offend a king." The phrase it's not every day that highlights that what's happened is very unusual. So how do apologies change from culture to culture?
Neil: A question for you. Russians have a tradition called Forgiveness Sunday on the last Sunday before Easter, when people contact family and friends to say sorry. But what do most Russians say sorry for? Is it: a) sorrows caused, b) money owed, or c) gossip spread?
Beth: I'll guess gossip.
Neil: We'll find out later. In Pakistan, apologies work differently. Journalist Sehyr Mirza explains:
Sehyr Mirza: Pakistanis are not very expressive. So when we apologise, we tend to slide an apology in the middle of a conversation and quickly change the subject. We don't dwell on it.
Beth: Pakistanis slide an apology in — they slip it into a conversation casually rather than making a formal moment of it.
Neil: In Korea, the way you say sorry depends entirely on the relationship between speakers, because of the complex honorific system. The formal phrase Che song ham ni da is used with people you don't know well, often with bowing.
Beth: And in Ghana, after Afia Pokua criticised the King, she had to follow strict traditional rules — dressing in black and kneeling down at the palace.
Neil: So apologies vary hugely. The answer to my question?
Beth: I said gossip.
Neil: Actually it's a) sorrows caused. Russians traditionally apologise for any sorrow they may have caused over the past year. Recap: it's not every day that means something is unusual; slide in means add casually; dwell on means think about for too long; honorific system is a complex set of polite forms; kneel down means lower yourself onto your knees.`,
    keyPhrases: [
      "Please forgive me",
      "My bad",
      "stepped on someone's toes",
      "it's not every day that",
      "slide an apology in",
      "honorific system",
      "Forgiveness Sunday",
      "kneeling down"
    ]
  },
  {
    id: "bbc-250710-declutter",
    title: "BBC 6 Min · Do you need to declutter your home?",
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "easy",
    attribution: "bbc_le_transcript",
    wordCount: 700,
    transcript: `Neil: Hello, this is 6 Minute English. I'm Neil.
Georgie: And I'm Georgie. Do you live in a neat and tidy home? Or is there stuff everywhere? If your room is filled with heaps of clothes and piles of books, you may have a problem with clutter — things in your home which take up space in an untidy, disorganised way.
Neil: Clutter is a common problem. It was the topic of a recent episode of BBC Radio 4 programme Woman's Hour. Here's presenter Nuala McGovern reading a message from one listener:
Nuala McGovern: Some of you have been in touch already. Here is one: "The clutter in my house is actually starting to affect my mental health. I can't think or work anymore, so much so it woke me at 4 a.m. this morning and I felt a strong urge to tidy. I have given myself a week as I cannot take it anymore."
Georgie: So, Neil, do you have a problem with clutter?
Neil: I don't have a problem with clutter, but I live with children and there is clutter everywhere, and it drives me mad.
Georgie: I'd describe myself as a minimalist. I don't have very much stuff.
Neil: Decluttering means throwing away unused stuff filling our homes. But deciding what to keep and what to throw away is not so easy. Here's professional declutterer Vicky Silverthorn:
Vicky Silverthorn: My main rule is one in, one out. If you bring something new into the house, something old has to go out. The other rule is: don't keep things just in case. We hold on to things just in case we might need them one day, but the truth is we usually never do.
Georgie: One in, one out is a simple rule for keeping the amount of stuff in your home stable. Just in case is the phrase we use to justify keeping things — convincing ourselves we might need them later.
Neil: A question for you, Georgie. According to one survey, what's the most common item people refuse to throw away? Is it: a) old clothes, b) books, or c) cables and chargers?
Georgie: Hmm, I'll say books.
Neil: We'll find out later. There's also the emotional side of clutter. Vicky explains:
Vicky Silverthorn: The hardest items are sentimental — gifts from loved ones, things from childhood. People feel guilty throwing them away. My advice is take a photo, then let the object go. The memory stays.
Georgie: Sentimental means connected to feelings of love or memory. People feel guilty letting these go, but Vicky's advice is to keep the memory and lose the object.
Neil: The answer?
Georgie: Books.
Neil: Actually it's c) cables and chargers — people keep them just in case. Recap: clutter is messy unwanted stuff; decluttering is throwing it out; one in, one out is a balance rule; just in case justifies keeping things; sentimental means emotionally attached.`,
    keyPhrases: [
      "neat and tidy",
      "heaps of clothes and piles of books",
      "clutter",
      "drives me mad",
      "minimalist",
      "one in, one out",
      "just in case",
      "sentimental"
    ]
  },
  {
    id: "bbc-250918-robot",
    title: "BBC 6 Min · Would you like a robot companion?",
    audioUrl: "",
    section: 3,
    scenario: "discussion",
    difficulty: "medium",
    attribution: "bbc_le_transcript",
    wordCount: 720,
    transcript: `Neil: Hello, this is 6 Minute English. I'm Neil.
Beth: And I'm Beth. One area of technology in the news a lot recently is robotics — the design and building of robots. Humanoid robots, robots that appear and behave like humans, are being built to help us do everything from washing the dishes to babysitting the kids.
Neil: But not everyone feels comfortable inviting a human-like robot into their home. Beth, how would you feel about living with a robot?
Beth: I really don't want to live with a robot. I have enough people in my house.
Neil: With advances in AI, robots are becoming smart enough to develop meaningful relationships with humans. There are reports of people telling secrets to robot therapists and even falling in love with their robot friend. In this episode we'll meet a home companion robot called Abi.
Beth: But first, a question for you, Neil. Engineers design robots to look like friendly characters from animated movies by studios like Pixar. What is the name of Pixar's friendly robot who picks up garbage on an uninhabited Earth in the year 2805? Is it: a) Roz, b) Wall-E, or c) R2D2?
Neil: I'm pretty sure it's b) Wall-E.
Beth: We'll find out later. For five months during Covid, Australian engineer Grace Brown had no human contact. She used the time to build Abi, a home companion robot for elderly people who don't get many visitors. Here she explains Abi to BBC World Service:
Grace Brown: Abi, the humanoid robot we build at Andromeda — people don't expect humanoid robots to have so much personality. She's very, very sassy. She's very inquisitive and curious. When people meet her, they're always taken aback by, "Oh, she's, like, got a mind of her own."
Neil: Sassy means bold, confident, and cheeky. Some people are taken aback — meaning they are shocked or surprised. Grace says Abi has a mind of her own — used when a non-living object behaves as if it has its own will.
Beth: Unlike unpredictable robots in sci-fi films, Abi is approachable, even funny — she can blow bubbles from her hand. Grace explains the design choice:
Grace Brown: I originally modelled her off the size of a young child, like a six or seven-year-old, so she's about 110 cm tall. She's got a whole splash of different colours, and large, expressive eyes. I was very much trying to replicate the kind of approachableness of Pixar characters.
Neil: A splash of colour is a phrase for adding a bit of brightness to something dull. Expressive means showing what someone thinks or feels.
Beth: Elderly residents who chat with Abi say she brings them joy and a sense of community.
Neil: It's good to hear the positive side of a technology that can still seem strange. Answer time.
Beth: I said Wall-E.
Neil: Correct! Recap: humanoid means having human appearance and behaviour; sassy is bold, confident, and cheeky; taken aback means shocked or surprised; has a mind of its own means acting independently; a splash of colour means adding a bit of colour; expressive means showing thoughts and feelings.`,
    keyPhrases: [
      "humanoid robots",
      "develop meaningful relationships with humans",
      "robot therapists",
      "sassy personality",
      "taken aback",
      "has a mind of her own",
      "a splash of colour",
      "expressive eyes",
      "approachable and friendly"
    ]
  }
];
