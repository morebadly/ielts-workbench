"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage";
import { MOCK_WRITING_PROMPTS } from "@/data/mockWriting";
import type { WritingPractice, WritingTaskType } from "@/types";

type Filter = "all" | WritingTaskType;

function formatDate(t: number): string {
  try {
    return new Date(t).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "—";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function pickAiOverall(p: WritingPractice): number | null {
  const fb = p.aiFeedback;
  if (!fb) return null;
  if (p.taskType === "task1") {
    const t1 = fb as { taskAchievement?: number; coherence?: number; lexical?: number; grammar?: number };
    const arr = [t1.taskAchievement, t1.coherence, t1.lexical, t1.grammar].filter(
      (n): n is number => typeof n === "number"
    );
    if (!arr.length) return null;
    return Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10;
  }
  const t2 = fb as { argumentStrength?: number; paragraphLogic?: number; vocabRepetition?: number };
  const arr = [t2.argumentStrength, t2.paragraphLogic].filter(
    (n): n is number => typeof n === "number"
  );
  if (!arr.length) return null;
  return Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10;
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <div className="h-16 rounded-lg bg-bg-soft text-center text-xs leading-[64px] muted">
        至少 2 次有评分的练习才能画曲线
      </div>
    );
  }
  const min = Math.min(...values, 4);
  const max = Math.max(...values, 9);
  const w = 320;
  const h = 64;
  const pad = 6;
  const xs = (i: number) =>
    pad + ((w - pad * 2) * i) / Math.max(1, values.length - 1);
  const ys = (v: number) => h - pad - ((h - pad * 2) * (v - min)) / Math.max(0.01, max - min);
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full">
      <path d={d} fill="none" stroke="#4F7A57" strokeWidth={2} />
      {values.map((v, i) => (
        <circle key={i} cx={xs(i)} cy={ys(v)} r={2.5} fill="#4F7A57" />
      ))}
    </svg>
  );
}

export default function WritingHistoryPage() {
  const [items, setItems] = useState<WritingPractice[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setItems(storage.getWritingPractices());
  }, []);

  const promptById = useMemo(
    () => new Map(MOCK_WRITING_PROMPTS.map((p) => [p.id, p])),
    []
  );

  const filtered = useMemo(() => {
    const list =
      filter === "all" ? items : items.filter((p) => p.taskType === filter);
    return [...list].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  }, [items, filter]);

  const stats = useMemo(() => {
    const submitted = filtered.filter((p) => p.submittedAt);
    const totalWords = submitted.reduce((s, p) => s + (p.wordCount || 0), 0);
    const totalMs = submitted.reduce((s, p) => s + (p.durationMs || 0), 0);
    const aiScored = submitted
      .map(pickAiOverall)
      .filter((n): n is number => n != null);
    const avg =
      aiScored.length > 0
        ? Math.round((aiScored.reduce((s, x) => s + x, 0) / aiScored.length) * 10) /
          10
        : null;
    return {
      total: submitted.length,
      totalWords,
      totalMs,
      avg,
      curve: [...submitted]
        .sort((a, b) => a.startedAt - b.startedAt)
        .map(pickAiOverall)
        .filter((n): n is number => n != null)
    };
  }, [filtered]);

  const removeOne = (id: string) => {
    if (typeof window === "undefined") return;
    if (!window.confirm("确认删除这条写作记录?")) return;
    const all = storage.getWritingPractices();
    const next = all.filter((p) => p.id !== id);
    window.localStorage.setItem("ielts-wb:writing-practice", JSON.stringify(next));
    setItems(next);
    if (openId === id) setOpenId(null);
  };

  return (
    <Container>
      <PageHeader
        title="写作历史"
        subtitle="所有提交记录、用时、字数和 AI 评分都在这里"
        right={
          <Link href="/writing/exam">
            <Button variant="primary">去写新一篇</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs muted">筛选</span>
          <Button
            variant={filter === "all" ? "primary" : "soft"}
            onClick={() => setFilter("all")}
          >
            全部
          </Button>
          <Button
            variant={filter === "task1" ? "primary" : "soft"}
            onClick={() => setFilter("task1")}
          >
            Task 1
          </Button>
          <Button
            variant={filter === "task2" ? "primary" : "soft"}
            onClick={() => setFilter("task2")}
          >
            Task 2
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="提交篇数" value={stats.total} />
          <Stat label="累计词数" value={stats.totalWords} />
          <Stat label="累计用时" value={formatDuration(stats.totalMs)} />
          <Stat
            label="平均 AI 分"
            value={stats.avg === null ? "—" : stats.avg.toFixed(1)}
          />
        </div>

        <div className="mt-4">
          <div className="mb-1 text-xs muted">AI 总评分趋势(按提交时间)</div>
          <MiniSparkline values={stats.curve} />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm muted">
            还没有写作记录。<Link href="/writing/exam" className="text-brand-700 hover:underline">去写一篇</Link>?
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const prompt = promptById.get(p.promptId);
            const overall = pickAiOverall(p);
            const opened = openId === p.id;
            return (
              <li key={p.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs muted">
                        <span className="pill bg-brand-100 text-brand-700">
                          {p.taskType === "task1" ? "Task 1" : "Task 2"}
                        </span>
                        <span>{formatDate(p.startedAt)}</span>
                        <span>·</span>
                        <span>{p.wordCount} 词</span>
                        <span>·</span>
                        <span>{formatDuration(p.durationMs)}</span>
                        {overall != null ? (
                          <span className="pill bg-brand-50 text-brand-700">
                            AI {overall.toFixed(1)}
                          </span>
                        ) : (
                          <span className="pill bg-bg-soft text-ink-soft">无 AI 评分</span>
                        )}
                      </div>
                      <div className="mt-1 line-clamp-2 text-sm">
                        {prompt?.title || prompt?.promptText || "外部题目 / 已删除题面"}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="soft"
                        onClick={() => setOpenId(opened ? null : p.id)}
                      >
                        {opened ? "收起" : "展开"}
                      </Button>
                      <Button variant="ghost" onClick={() => removeOne(p.id)}>
                        删除
                      </Button>
                    </div>
                  </div>

                  {opened ? (
                    <div className="mt-3 space-y-3 border-t border-black/5 pt-3">
                      {prompt?.promptText ? (
                        <div className="rounded-lg bg-bg-soft p-3 text-sm">
                          <div className="mb-1 text-xs muted">题面</div>
                          {prompt.promptText}
                        </div>
                      ) : null}
                      <div className="rounded-lg border border-black/5 p-3">
                        <div className="mb-1 text-xs muted">我的作文</div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {p.content}
                        </p>
                      </div>
                      {p.aiFeedback ? (
                        <details className="rounded-lg border border-black/5 p-3">
                          <summary className="cursor-pointer text-sm text-brand-700">
                            查看 AI 反馈原文
                          </summary>
                          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs muted">
                            {JSON.stringify(p.aiFeedback, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-bg-soft p-3 text-center">
      <div className="text-xs muted">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
