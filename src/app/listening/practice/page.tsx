"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/**
 * 来源标签:
 * - bbc_le: BBC 真实公开节目 (含 mp3 直链, 仅近 30 天集次)
 * - bbc_le_transcript: BBC 原文文本素材 (mp3 已下架, AI 朗读)
 * - external_link: 用户自填外链 (custom 素材)
 * - self_written / undefined: 站内自写, 用 MiniMax TTS 朗读, 内容为 AI 朗读 + 人写文字
 */
const ATTRIBUTION_BADGE: Record<
  NonNullable<ListeningItem["attribution"]>,
  { label: string; tone: "real" | "ai" | "user" | "mixed" }
> = {
  bbc_le: { label: "BBC 真实音频", tone: "real" },
  bbc_le_transcript: { label: "BBC 原文 · AI 朗读", tone: "mixed" },
  external_link: { label: "外链 (你自填)", tone: "user" },
  self_written: { label: "原创 + AI 朗读", tone: "ai" }
};

const TONE_CLASS: Record<"real" | "ai" | "user" | "mixed", string> = {
  real: "bg-emerald-100 text-emerald-800",
  ai: "bg-amber-100 text-amber-800",
  user: "bg-sky-100 text-sky-800",
  mixed: "bg-indigo-100 text-indigo-800"
};

export default function ListeningPracticePage() {
  const { user, bump, setUser } = useDailyTask();
  const [diff, setDiff] = useState<DiffFilter>("all");
  const [customItems, setCustomItems] = useState<ListeningItem[]>([]);

  useEffect(() => {
    setCustomItems(storage.getCustomListening());
  }, []);

  // 自定义素材排在前面, 用 isCustom 标记给 UI
  const allItems = useMemo<ListeningItem[]>(
    () => [...customItems, ...LISTENING_ITEMS],
    [customItems]
  );

  const filtered = useMemo(
    () =>
      diff === "all"
        ? allItems
        : allItems.filter((l) => l.difficulty === diff),
    [diff, allItems]
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
    () =>
      allItems.find((l) => l.id === itemId) ?? LISTENING_ITEMS[0],
    [itemId, allItems]
  );
  const isCustom = item.id.startsWith("ls-custom-");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [transcription, setTranscription] = useState("");
  const [newWords, setNewWords] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState("");
  const [audioFailed, setAudioFailed] = useState(false);

  /**
   * 单 audio 实例 ref。
   *
   * v1 的旧实现每次点 "再听" / "慢速" 都 new Audio(...), 老实例没停, 多个音轨同时响,
   * "停止" 又只能停 TTS 不能停外链, 三个按钮互掐。
   *
   * v2 改成: 页面上一个 <audio controls ref>, 三个按钮全部操作 ref, 浏览器原生
   * 进度条 + 总时长免费拿到。
   */
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 切素材时, 重置进度并暂停, 不重叠
  useEffect(() => {
    setAudioFailed(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopSpeak();
  }, [item.id]);

  // 卸载时, 兜底清干净
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      stopSpeak();
    };
  }, []);

  /** 用外链音频 (优先), 失败回退 TTS */
  const useTts = !item.audioUrl || audioFailed;

  const playFromStart = (rate = 1) => {
    if (useTts) {
      stopSpeak();
      speak(item.transcript, { voice: user.preferences.voice, rate });
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = rate;
    a.currentTime = 0;
    a.play().catch(() => {
      setAudioFailed(true);
      speak(item.transcript, { voice: user.preferences.voice, rate });
    });
  };

  const stopAll = () => {
    audioRef.current?.pause();
    stopSpeak();
  };

  const start = () => {
    playFromStart(1);
    setStep(2);
    setUser({
      ...user,
      lastLocation: { label: "继续听力精听", href: "/listening/practice" }
    });
  };

  const replay = (rate = 1) => {
    stopAll();
    playFromStart(rate);
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
              stopAll();
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
          {(() => {
            const attr = item.attribution ?? "self_written";
            const badge = ATTRIBUTION_BADGE[attr];
            if (!badge) return null;
            return (
              <span className={`pill ${TONE_CLASS[badge.tone]}`}>
                {badge.label}
              </span>
            );
          })()}
          <span className="pill bg-bg-soft text-ink-soft">
            {useTts ? "TTS 朗读" : "BBC 音频"}
          </span>
        </div>

        {!useTts ? (
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            src={item.audioUrl}
            className="w-full"
            onError={() => setAudioFailed(true)}
          />
        ) : null}

        {audioFailed ? (
          <p className="text-xs text-amber-700">
            外链音频加载失败, 已回退到 TTS 朗读
          </p>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <p className="muted text-sm">
              {useTts
                ? "点开始, AI 朗读整段。"
                : "用上面的播放器播放, 或点开始用默认速度播放。"}
            </p>
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
            <Button variant="ghost" onClick={stopAll}>
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
