"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { speak, stopSpeak } from "@/lib/tts";
import { LISTENING_ITEMS } from "@/data/listeningItems";
import { useDailyTask } from "@/hooks/useDailyTask";
import { storage } from "@/lib/storage";
import type { ListeningItem, ReviewItem } from "@/types";

type DiffFilter = "all" | "easy" | "medium" | "hard";

const SECTION_LABEL: Record<NonNullable<ListeningItem["section"]>, string> = {
  1: "Section 1 · 社交",
  2: "Section 2 · 公共",
  3: "Section 3 · 学术讨论",
  4: "Section 4 · 学术讲座"
};

const DIFF_LABEL: Record<ListeningItem["difficulty"], string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难"
};

export default function ListeningPracticePage() {
  const { user, bump, setUser } = useDailyTask();
  const [diff, setDiff] = useState<DiffFilter>("all");
  const filtered = useMemo(
    () =>
      diff === "all"
        ? LISTENING_ITEMS
        : LISTENING_ITEMS.filter((l) => l.difficulty === diff),
    [diff]
  );
  const [itemId, setItemId] = useState(LISTENING_ITEMS[0].id);
  // 切换难度后, 如果当前选中的素材不在筛选结果里, 自动选第一条
  useEffect(() => {
    if (!filtered.some((l) => l.id === itemId)) {
      stopSpeak();
      setItemId(filtered[0]?.id ?? LISTENING_ITEMS[0].id);
      setStep(1);
      setTranscription("");
      setNewWords([]);
    }
  }, [diff, filtered, itemId]);
  const item = useMemo(
    () => LISTENING_ITEMS.find((l) => l.id === itemId) ?? LISTENING_ITEMS[0],
    [itemId]
  );

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [transcription, setTranscription] = useState("");
  const [newWords, setNewWords] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState("");
  const [audioFailed, setAudioFailed] = useState(false);

  const playExternalOrTts = () => {
    setAudioFailed(false);
    // 外链音频: 用 <audio> 自动播放; 失败回退 TTS
    if (item.audioUrl) {
      const a = new Audio(item.audioUrl);
      a.onerror = () => {
        setAudioFailed(true);
        speak(item.transcript, { voice: user.preferences.voice });
      };
      a.play().catch(() => {
        setAudioFailed(true);
        speak(item.transcript, { voice: user.preferences.voice });
      });
      return;
    }
    speak(item.transcript, { voice: user.preferences.voice });
  };

  const start = () => {
    playExternalOrTts();
    setStep(2);
    setUser({
      ...user,
      lastLocation: { label: "继续听力精听", href: "/listening/practice" }
    });
  };

  const replay = (rate = 1) => {
    if (item.audioUrl && !audioFailed) {
      const a = new Audio(item.audioUrl);
      a.playbackRate = rate;
      a.onerror = () => {
        setAudioFailed(true);
        speak(item.transcript, { voice: user.preferences.voice, rate });
      };
      a.play().catch(() => {
        setAudioFailed(true);
        speak(item.transcript, { voice: user.preferences.voice, rate });
      });
      return;
    }
    speak(item.transcript, { voice: user.preferences.voice, rate });
  };

  const finish = () => {
    bump("listeningSessionsDone");
    newWords.forEach((w) => {
      const review: ReviewItem = {
        id: `lst-${item.id}-${w}`,
        type: "listening",
        refId: item.id,
        payload: { word: w, source: item.title },
        due: Date.now() + 24 * 3600 * 1000,
        ease: 2.5,
        interval: 1
      };
      storage.upsertReviewItem(review);
    });
    setStep(4);
  };

  return (
    <Container>
      <PageHeader
        title="听力精听"
        subtitle="先听 → 听写 → 看原文 → 标出生词 → 加入复习箱。"
        right={
          <Link href="/listening">
            <Button variant="ghost">返回</Button>
          </Link>
        }
      />

      <Card className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm muted">难度</span>
          {(["all", "easy", "medium", "hard"] as DiffFilter[]).map((d) => (
            <Button
              key={d}
              variant={diff === d ? "primary" : "soft"}
              onClick={() => setDiff(d)}
            >
              {d === "all" ? "全部" : DIFF_LABEL[d]}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm muted">素材</span>
          <select
            className="input max-w-xs"
            value={itemId}
            onChange={(e) => {
              stopSpeak();
              setItemId(e.target.value);
              setStep(1);
              setTranscription("");
              setNewWords([]);
            }}
          >
            {filtered.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} · {DIFF_LABEL[l.difficulty]}
                {l.section ? ` · S${l.section}` : ""}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs muted">
            {filtered.length} / {LISTENING_ITEMS.length} 条
          </span>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <CardHeader
          title={item.title}
          subtitle={`${item.section ? `Section ${item.section}` : ""}${item.scenario ? ` · ${item.scenario}` : ""} · ${DIFF_LABEL[item.difficulty]} · 第 ${step}/4 步`}
        />
        <div className="flex flex-wrap items-center gap-1.5 -mt-2">
          {item.section ? (
            <span className="pill bg-brand-100 text-brand-700">
              {SECTION_LABEL[item.section]}
            </span>
          ) : null}
          {item.scenario ? (
            <span className="pill bg-bg-soft text-ink-soft">{item.scenario}</span>
          ) : null}
          <span className="pill bg-bg-soft text-ink-soft">
            {DIFF_LABEL[item.difficulty]}
          </span>
          <span className="pill bg-bg-soft text-ink-soft">
            {item.audioUrl && !audioFailed ? "外链音频" : "TTS 朗读"}
          </span>
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            <p className="muted text-sm">点开始,听一遍整段。</p>
            <Button onClick={start}>▶ 开始播放</Button>
          </div>
        ) : null}

        {step >= 2 ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="soft" onClick={() => replay(1)}>
              ▶ 再听一遍
            </Button>
            <Button variant="ghost" onClick={() => replay(0.7)}>
              慢速
            </Button>
            <Button variant="ghost" onClick={stopSpeak}>
              停止
            </Button>
          </div>
        ) : null}

        {step >= 2 && step < 4 ? (
          <div>
            <div className="mb-1 text-sm muted">
              听写关键词或整句(没听清的留空,稍后看原文核对)
            </div>
            <textarea
              className="textarea"
              rows={5}
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="一行一句,听到什么写什么"
            />
            <div className="mt-2 flex gap-2">
              {step === 2 ? (
                <Button onClick={() => setStep(3)}>查看原文</Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {step >= 3 ? (
          <div className="rounded-xl bg-bg-soft/60 p-4 text-sm leading-relaxed">
            <div className="mb-2 text-xs muted">原文</div>
            <p className="font-serif">{item.transcript}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.keyPhrases.map((kp) => (
                <span key={kp} className="pill bg-brand-100 text-brand-700">
                  {kp}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <div className="mb-1 text-sm muted">把生词加进来,听完后会自动放进复习箱</div>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="输入一个生词,回车添加"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && wordInput.trim()) {
                    setNewWords((arr) => Array.from(new Set([...arr, wordInput.trim()])));
                    setWordInput("");
                  }
                }}
              />
              <Button onClick={finish}>完成今日精听</Button>
            </div>
            {newWords.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {newWords.map((w) => (
                  <span key={w} className="pill">
                    {w}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm">
            <div className="font-medium text-brand-700">今日精听完成。</div>
            <div className="mt-1 muted">
              已收录 {newWords.length} 个生词。明天复习箱里会出现,记得回来看看。
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="soft"
                onClick={() => {
                  setStep(1);
                  setTranscription("");
                  setNewWords([]);
                }}
              >
                再练一段
              </Button>
              <Link href="/">
                <Button variant="ghost">返回首页</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </Card>
    </Container>
  );
}
