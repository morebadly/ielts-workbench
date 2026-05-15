"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage";
import { speak, stopSpeak } from "@/lib/tts";
import type { ListeningItem } from "@/types";

const SCENARIO_OPTIONS: Array<NonNullable<ListeningItem["scenario"]>> = [
  "campus",
  "service",
  "travel",
  "academic",
  "lecture",
  "monologue",
  "discussion"
];

const DIFF_OPTIONS: Array<ListeningItem["difficulty"]> = ["easy", "medium", "hard"];

interface FormState {
  id: string | null; // 编辑时存在
  title: string;
  audioUrl: string;
  transcript: string;
  keyPhrasesText: string; // 多行,一行一个
  difficulty: ListeningItem["difficulty"];
  section: 1 | 2 | 3 | 4;
  scenario: NonNullable<ListeningItem["scenario"]>;
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  audioUrl: "",
  transcript: "",
  keyPhrasesText: "",
  difficulty: "medium",
  section: 2,
  scenario: "monologue"
};

function genId(): string {
  return `ls-custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export default function CustomListeningPage() {
  const [items, setItems] = useState<ListeningItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    setItems(storage.getCustomListening());
  }, []);

  const wordCount = countWords(form.transcript);
  const isEditing = form.id !== null;

  const reset = () => {
    setForm(EMPTY_FORM);
    setError(null);
    stopSpeak();
    setPreviewing(false);
  };

  const submit = () => {
    setError(null);
    const title = form.title.trim();
    const transcript = form.transcript.trim();
    if (title.length < 4) return setError("标题至少 4 个字符");
    if (transcript.length < 50) return setError("听力原文至少 50 个字符");
    if (form.audioUrl && !/^https?:\/\//i.test(form.audioUrl)) {
      return setError("音频链接必须是 http:// 或 https:// 开头, 或者留空走 TTS");
    }

    const keyPhrases = form.keyPhrasesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const item: ListeningItem = {
      id: form.id || genId(),
      title,
      audioUrl: form.audioUrl.trim(),
      transcript,
      keyPhrases,
      difficulty: form.difficulty,
      section: form.section,
      scenario: form.scenario,
      attribution: form.audioUrl.trim() ? "external_link" : "self_written",
      wordCount
    };

    storage.saveCustomListening(item);
    setItems(storage.getCustomListening());
    reset();
  };

  const edit = (item: ListeningItem) => {
    setForm({
      id: item.id,
      title: item.title,
      audioUrl: item.audioUrl,
      transcript: item.transcript,
      keyPhrasesText: item.keyPhrases.join("\n"),
      difficulty: item.difficulty,
      section: item.section ?? 2,
      scenario: item.scenario ?? "monologue"
    });
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = (id: string) => {
    if (!confirm("确认删除这条听力素材?(删除后无法恢复)")) return;
    storage.deleteCustomListening(id);
    setItems(storage.getCustomListening());
    if (form.id === id) reset();
  };

  const preview = () => {
    if (!form.transcript.trim()) return;
    setPreviewing(true);
    speak(form.transcript, {
      onEnd: () => setPreviewing(false),
      onError: () => setPreviewing(false)
    });
  };

  return (
    <Container>
      <PageHeader
        title="自定义听力素材"
        subtitle="上传你自己整理的英文听力,粘贴 transcript 即可,可选填外链 mp3 URL。"
        right={
          <Link href="/listening/practice" className="text-sm text-brand-700 hover:underline">
            ← 回精听
          </Link>
        }
      />

      <Card className="mb-4 space-y-3" padding="lg">
        <CardHeader
          title={isEditing ? "编辑素材" : "新增素材"}
          subtitle={`原文当前 ${wordCount} 词${wordCount > 0 ? ` · 大约朗读 ${Math.ceil(wordCount / 150)} 分钟` : ""}`}
        />

        <div className="space-y-1">
          <label className="text-xs muted">标题</label>
          <input
            className="input w-full"
            placeholder="例如:BBC 6 Minute English - Why we sleep"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={120}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs muted">Section</label>
            <select
              className="input w-full"
              value={form.section}
              onChange={(e) =>
                setForm({ ...form, section: Number(e.target.value) as 1 | 2 | 3 | 4 })
              }
            >
              <option value={1}>S1 · 社交</option>
              <option value={2}>S2 · 公共独白</option>
              <option value={3}>S3 · 学术讨论</option>
              <option value={4}>S4 · 学术讲座</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs muted">场景</label>
            <select
              className="input w-full"
              value={form.scenario}
              onChange={(e) =>
                setForm({
                  ...form,
                  scenario: e.target.value as FormState["scenario"]
                })
              }
            >
              {SCENARIO_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs muted">难度</label>
            <select
              className="input w-full"
              value={form.difficulty}
              onChange={(e) =>
                setForm({ ...form, difficulty: e.target.value as ListeningItem["difficulty"] })
              }
            >
              {DIFF_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs muted">
            音频链接 (可选,留空时使用 TTS 朗读 transcript)
          </label>
          <input
            className="input w-full"
            placeholder="https://example.com/audio.mp3"
            value={form.audioUrl}
            onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
          />
          <p className="text-xs muted">
            建议填 BBC / British Council / VOA 等公开的 mp3 直链。链接失效或跨域时会自动回退到 TTS 朗读。
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs muted">听力原文 transcript</label>
          <textarea
            className="input min-h-[180px] w-full whitespace-pre-wrap"
            placeholder="粘贴英文原文..."
            value={form.transcript}
            onChange={(e) => setForm({ ...form, transcript: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs muted">考点关键短语 (一行一条,可省略)</label>
          <textarea
            className="input min-h-[100px] w-full"
            placeholder="例如:&#10;sustainable development&#10;circular economy&#10;by twenty thirty-five"
            value={form.keyPhrasesText}
            onChange={(e) => setForm({ ...form, keyPhrasesText: e.target.value })}
          />
        </div>

        {error ? (
          <div className="rounded-lg bg-accent-rose/10 p-2 text-sm text-accent-rose">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={submit}>
            {isEditing ? "保存修改" : "添加到我的素材"}
          </Button>
          <Button variant="soft" onClick={preview} disabled={!form.transcript.trim()}>
            {previewing ? "朗读中..." : "TTS 试听"}
          </Button>
          {previewing ? (
            <Button
              variant="soft"
              onClick={() => {
                stopSpeak();
                setPreviewing(false);
              }}
            >
              停止
            </Button>
          ) : null}
          {isEditing ? (
            <Button variant="soft" onClick={reset}>
              取消编辑
            </Button>
          ) : null}
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={`我的听力素材 (${items.length})`}
          subtitle="保存在本地浏览器,登录账号后可同步到云端"
        />
        {items.length === 0 ? (
          <p className="text-sm muted">还没有自定义素材。先在上方表单添加一条。</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-black/5 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs muted">
                      {item.section ? (
                        <span className="pill bg-brand-100 text-brand-700">
                          S{item.section}
                        </span>
                      ) : null}
                      {item.scenario ? (
                        <span className="pill bg-bg-soft">{item.scenario}</span>
                      ) : null}
                      <span className="pill bg-bg-soft">{item.difficulty}</span>
                      <span className="pill bg-bg-soft">
                        {item.audioUrl ? "外链音频" : "TTS"}
                      </span>
                      {item.wordCount ? (
                        <span>· {item.wordCount} 词</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="soft" onClick={() => edit(item)}>
                      编辑
                    </Button>
                    <Button variant="soft" onClick={() => del(item.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
