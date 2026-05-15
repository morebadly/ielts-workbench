"use client";

import { useEffect, useState } from "react";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage";
import { useDailyTask } from "@/hooks/useDailyTask";
import { getActiveBook } from "@/data/mockWords";
import { BookManager } from "@/components/settings/BookManager";
import { AuthCard } from "@/components/sync/AuthCard";
import { SyncCard } from "@/components/sync/SyncCard";
import type { DailyTaskTargets } from "@/types";

export default function SettingsPage() {
  const { user, setUser, refresh } = useDailyTask();
  const [targets, setTargets] = useState<DailyTaskTargets>(user.preferences.targets);
  const [voice, setVoice] = useState<"uk" | "us">(user.preferences.voice);
  const [day, setDay] = useState<number>(user.currentDay);
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<
    { imported: number; skipped: number; skippedKeys: string[] } | null
  >(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const activeBook = getActiveBook(user.activeBookId);

  useEffect(() => {
    setTargets(user.preferences.targets);
    setVoice(user.preferences.voice);
    setDay(user.currentDay);
  }, [user]);

  const save = () => {
    setUser({
      ...user,
      currentDay: Math.min(activeBook.totalDays, Math.max(1, day)),
      preferences: { ...user.preferences, voice, targets }
    });
    setSavedAt(Date.now());
  };

  const handleExport = () => setExportText(storage.exportAll());
  const handleImport = () => {
    setImportError(null);
    setImportResult(null);
    if (!importText.trim()) {
      setImportError("请粘贴要导入的 JSON");
      return;
    }
    try {
      const r = storage.importAll(importText);
      setImportResult(r);
      if (r.imported > 0) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      setImportError((e as Error).message);
    }
  };
  const handleClear = () => {
    if (!confirm("确认清空全部本地学习数据?这一步不可撤销。")) return;
    storage.clearAll();
    window.location.reload();
  };

  const fields: Array<{ key: keyof DailyTaskTargets; label: string }> = [
    { key: "newWords", label: "今日新词" },
    { key: "reviewWords", label: "今日复习词" },
    { key: "dictation", label: "默写练习" },
    { key: "vocabularyArticle", label: "词汇文章" },
    { key: "writingSentences", label: "写作句子" },
    { key: "listeningSessions", label: "听力精听" }
  ];

  return (
    <Container>
      <PageHeader title="设置" subtitle="词书 / 每日任务量 / 英美音 / 数据导出导入" />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AuthCard />
        <SyncCard />
      </div>

      <Card className="mb-4">
        <h3 className="section-title">当前进度</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs muted">当前词书</div>
            <div className="mt-1 rounded-xl bg-bg-soft/60 px-3 py-2 text-sm">
              {activeBook.name} · 共 {activeBook.totalDays} 天
            </div>
          </div>
          <div>
            <div className="text-xs muted">当前学到 Day</div>
            <input
              type="number"
              min={1}
              max={activeBook.totalDays}
              className="input mt-1"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            />
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <BookManager user={user} onChange={refresh} />
      </div>

      <Card className="mb-4">
        <h3 className="section-title">每日任务量</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fields.map((f) => (
            <div key={f.key}>
              <div className="text-xs muted">{f.label}</div>
              <input
                type="number"
                min={0}
                className="input mt-1"
                value={targets[f.key]}
                onChange={(e) =>
                  setTargets((t) => ({ ...t, [f.key]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="section-title">发音偏好</h3>
        <div className="mt-3 flex gap-2">
          <Button variant={voice === "uk" ? "primary" : "soft"} onClick={() => setVoice("uk")}>
            英音
          </Button>
          <Button variant={voice === "us" ? "primary" : "soft"} onClick={() => setVoice("us")}>
            美音
          </Button>
        </div>
        <p className="mt-2 text-xs muted">
          浏览器自带的 Web Speech API,音色取决于操作系统。后续可接入更高质量的 TTS。
        </p>
      </Card>

      <div className="mb-4 flex items-center gap-3">
        <Button onClick={save}>保存设置</Button>
        {savedAt && Date.now() - savedAt < 3000 ? (
          <span className="text-sm text-brand-700">✓ 已保存,首页和任务卡已同步</span>
        ) : null}
      </div>

      <Card className="mb-4">
        <h3 className="section-title">数据导出 / 导入</h3>
        <p className="mt-1 text-xs muted">
          目前数据保存在本地 localStorage。换设备时可导出 JSON,在新设备粘贴导入。
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="soft" onClick={handleExport}>
            导出
          </Button>
          <Button variant="ghost" onClick={() => setExportText("")}>
            清空显示
          </Button>
        </div>
        {exportText ? (
          <textarea className="textarea mt-3 font-mono text-xs" rows={6} readOnly value={exportText} />
        ) : null}
        <div className="mt-3">
          <textarea
            className="textarea font-mono text-xs"
            rows={4}
            placeholder="把另一台设备导出的 JSON 粘贴到这里"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <Button className="mt-2" variant="soft" onClick={handleImport}>
            导入并刷新
          </Button>
          {importError ? (
            <div className="mt-2 rounded-lg bg-accent-rose/10 p-2 text-xs text-accent-rose">
              ✗ {importError}
            </div>
          ) : null}
          {importResult ? (
            <div className="mt-2 rounded-lg bg-brand-50 p-2 text-xs text-brand-700">
              已导入 {importResult.imported} 项,跳过 {importResult.skipped} 项
              {importResult.skippedKeys.length ? (
                <div className="mt-1 text-ink-soft">
                  跳过的非法键:{importResult.skippedKeys.join(", ")}
                </div>
              ) : null}
              {importResult.imported > 0 ? (
                <div className="mt-1 text-ink-soft">即将刷新页面...</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <h3 className="section-title text-accent-rose">危险操作</h3>
        <p className="mt-1 text-xs muted">清空所有本地学习数据。慎用。</p>
        <Button className="mt-3" variant="ghost" onClick={handleClear}>
          清空本地数据
        </Button>
      </Card>
    </Container>
  );
}
