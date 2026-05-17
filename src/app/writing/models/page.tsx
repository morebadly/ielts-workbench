"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SIMON_ESSAYS } from "@/data/simonEssaysLoader";

/**
 * v1.10.6 任务 B: Simon 范文库主页
 *
 * 列表 + 关键词筛选 + 选中后右侧/底部展开正文。
 * 移动端为求显示完整, 选中后用 fixed 浮层覆盖。
 */
export default function SimonModelsPage() {
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string>(SIMON_ESSAYS[0]?.id || "");

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return SIMON_ESSAYS;
    return SIMON_ESSAYS.filter(
      (e) =>
        e.titleZh.includes(kw) ||
        e.promptText.toLowerCase().includes(kw) ||
        e.essay.toLowerCase().includes(kw)
    );
  }, [q]);

  const active = useMemo(
    () => SIMON_ESSAYS.find((e) => e.id === activeId) || filtered[0],
    [activeId, filtered]
  );

  return (
    <Container>
      <PageHeader
        title="Simon 9 分范文"
        subtitle={`考官 Simon 撰写, 共 ${SIMON_ESSAYS.length} 篇 Task 2 议论文范文。`}
        right={
          <Link href="/writing">
            <Button variant="ghost">返回</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 列表区 */}
        <Card className="lg:col-span-1">
          <input
            className="input"
            placeholder="搜中文标题/题目/正文..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <p className="mt-1 text-xs muted">
            {filtered.length} / {SIMON_ESSAYS.length} 篇
          </p>
          <ul className="mt-3 max-h-[60vh] divide-y divide-black/5 overflow-y-auto pr-1">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={
                    e.id === active?.id
                      ? "block w-full rounded-md bg-brand-100 px-3 py-2 text-left"
                      : "block w-full rounded-md px-3 py-2 text-left hover:bg-bg-soft"
                  }
                  onClick={() => setActiveId(e.id)}
                >
                  <div className="text-sm font-medium">{e.titleZh}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs muted">
                    {e.promptText}
                  </div>
                  <div className="mt-1 text-[10px] muted">
                    Task {e.taskType === "task1" ? "1" : "2"} · {e.wordCount} words ·
                    Band {e.band}
                  </div>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="py-8 text-center text-sm muted">没有符合的篇章</li>
            ) : null}
          </ul>
        </Card>

        {/* 范文展示区 */}
        <Card className="lg:col-span-2">
          {active ? (
            <article className="space-y-4">
              <header>
                <div className="text-xs muted">题目</div>
                <p className="mt-1 font-serif text-[15px] leading-relaxed">
                  {active.promptText}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-brand-100 px-2 py-0.5 text-brand-700">
                    {active.titleZh}
                  </span>
                  <span className="rounded-md bg-bg-soft px-2 py-0.5 muted">
                    Task {active.taskType === "task1" ? "1" : "2"}
                  </span>
                  <span className="rounded-md bg-bg-soft px-2 py-0.5 muted">
                    {active.wordCount} words
                  </span>
                  <span className="rounded-md bg-accent-warm/15 px-2 py-0.5 text-amber-800">
                    Band {active.band}
                  </span>
                </div>
              </header>
              <div>
                <div className="text-xs muted">范文</div>
                <div className="mt-2 space-y-3 font-serif text-[15px] leading-relaxed">
                  {active.essay.split(/\n\n+/).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </article>
          ) : (
            <p className="py-12 text-center text-sm muted">没有可显示的范文</p>
          )}
        </Card>
      </div>
    </Container>
  );
}
