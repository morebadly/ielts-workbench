"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  DictationPanel,
  DICTATION_MODE_LABEL
} from "@/components/vocabulary/DictationPanel";
import { getWordsByDay } from "@/data/mockWords";
import { useDailyTask } from "@/hooks/useDailyTask";
import { storage } from "@/lib/storage";
import type { DictationMode } from "@/types";

const MODES: DictationMode[] = [
  "listenWriteWord",
  "chineseToEnglish",
  "fillInSentence",
  "listenWriteSentence"
];

export default function DictationPage() {
  // hydration 安全: 同 learn 页, mounted gate 防 #425
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user, bump, setUser } = useDailyTask();
  const dayWords = useMemo(
    () => (mounted ? getWordsByDay(user.activeBookId, user.currentDay) : []),
    [mounted, user.activeBookId, user.currentDay]
  );
  const [mode, setMode] = useState<DictationMode | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);

  const start = (m: DictationMode) => {
    setMode(m);
    setStats({ correct: 0, wrong: 0 });
    setDone(false);
    setUser({
      ...user,
      lastLocation: { label: "继续默写练习", href: "/vocabulary/dictation" }
    });
  };

  const handleResult = (correct: boolean) => {
    setStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1)
    }));
    if (mode) {
      storage.appendDictationResult({
        wordId: "",
        mode,
        userInput: "",
        correct,
        at: Date.now()
      });
    }
    bump("dictationDone");
  };

  if (!mode) {
    return (
      <Container>
        <PageHeader
          title="默写练习"
          subtitle="选择今天想用的练法。"
          right={
            <Link href="/vocabulary">
              <Button variant="ghost">返回</Button>
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <Card
              key={m}
              className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => start(m)}
            >
              <h3 className="section-title">{DICTATION_MODE_LABEL[m]}</h3>
              <p className="mt-1 text-sm muted">
                {m === "listenWriteWord" && "播放单词发音,你输入英文单词。"}
                {m === "chineseToEnglish" && "看中文意思,写出对应英文。"}
                {m === "fillInSentence" && "看例句挖空,补全单词。"}
                {m === "listenWriteSentence" && "听整句,完整默写。"}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title={DICTATION_MODE_LABEL[mode]}
        subtitle={`已答对 ${stats.correct} 题 · 错 ${stats.wrong} 题`}
        right={
          <Button variant="ghost" onClick={() => setMode(null)}>
            换一种模式
          </Button>
        }
      />
      {!done ? (
        <DictationPanel
          words={dayWords}
          mode={mode}
          voice={user.preferences.voice}
          onResult={handleResult}
          onFinish={() => setDone(true)}
        />
      ) : (
        <Card>
          <h3 className="section-title">这一组练完了。</h3>
          <p className="mt-1 text-sm muted">
            正确 {stats.correct} / 错 {stats.wrong}。错的词会自动算入今日默写量,稍后可以在复习箱再练。
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => start(mode)}>再来一遍</Button>
            <Button variant="soft" onClick={() => setMode(null)}>
              换一种模式
            </Button>
            <Link href="/">
              <Button variant="ghost">返回首页</Button>
            </Link>
          </div>
        </Card>
      )}
    </Container>
  );
}
