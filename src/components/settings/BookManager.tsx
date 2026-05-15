"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage";
import { getAllBooks, MOCK_BOOK } from "@/data/mockWords";
import {
  BookParseError,
  CSV_TEMPLATE,
  parseAuto,
  type ParsedBook
} from "@/lib/bookImport";
import type { VocabularyBook, UserProgress } from "@/types";
import { notifyStorageUpdated } from "@/hooks/useDailyTask";

interface Props {
  user: UserProgress;
  onChange: () => void;
}

export function BookManager({ user, onChange }: Props) {
  const [books, setBooks] = useState<VocabularyBook[]>(() => getAllBooks());
  const [importText, setImportText] = useState("");
  const [importName, setImportName] = useState("");
  const [preview, setPreview] = useState<ParsedBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBooks(getAllBooks());
  }, [user.activeBookId]);

  const refresh = () => {
    setBooks(getAllBooks());
    onChange();
    notifyStorageUpdated();
  };

  const handleFile = async (file: File) => {
    setError(null);
    setPreview(null);
    setWarnings([]);
    try {
      const text = await file.text();
      const parsed = parseAuto(text, file.name);
      if (importName.trim()) parsed.book.name = importName.trim();
      else parsed.book.name = file.name.replace(/\.(csv|json|txt)$/i, "");
      setPreview(parsed);
      setWarnings(parsed.warnings);
    } catch (e) {
      if (e instanceof BookParseError) {
        setError(
          e.message + (e.details.length ? ` (前几条问题:${e.details.slice(0, 3).map((d) => `第 ${d.line} 行 ${d.message}`).join(";")})` : "")
        );
      } else {
        setError((e as Error).message);
      }
    }
  };

  const handlePasteParse = () => {
    setError(null);
    setPreview(null);
    setWarnings([]);
    if (!importText.trim()) {
      setError("请粘贴 CSV 或 JSON 内容");
      return;
    }
    try {
      const parsed = parseAuto(importText);
      if (importName.trim()) parsed.book.name = importName.trim();
      setPreview(parsed);
      setWarnings(parsed.warnings);
    } catch (e) {
      if (e instanceof BookParseError) {
        setError(e.message);
      } else {
        setError((e as Error).message);
      }
    }
  };

  const confirmImport = () => {
    if (!preview) return;
    storage.saveBook(preview.book, preview.words);
    storage.setUser({ ...user, activeBookId: preview.book.id, currentDay: 1 });
    setPreview(null);
    setImportText("");
    setImportName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    refresh();
  };

  const switchBook = (bookId: string) => {
    storage.setUser({ ...user, activeBookId: bookId, currentDay: 1 });
    refresh();
  };

  /** 当前启用的 book id 列表(老数据缺字段时回退到 [activeBookId]) */
  const enabledIds =
    user.enabledBookIds && user.enabledBookIds.length
      ? user.enabledBookIds
      : [user.activeBookId];

  const toggleEnabled = (bookId: string, checked: boolean) => {
    // activeBook 必须保持启用, 不允许取消
    if (bookId === user.activeBookId && !checked) return;
    let next = enabledIds.filter((x) => x !== bookId);
    if (checked) next = [...next, bookId];
    // 兜底:确保 activeBook 在列表里
    if (!next.includes(user.activeBookId)) next.push(user.activeBookId);
    storage.setUser({ ...user, enabledBookIds: next });
    refresh();
  };

  const removeBook = (bookId: string) => {
    if (bookId === MOCK_BOOK.id) return;
    if (!confirm("确认删除这本词书?该词书的进度数据不会被清除。")) return;
    storage.deleteBook(bookId);
    if (user.activeBookId === bookId) {
      storage.setUser({ ...user, activeBookId: MOCK_BOOK.id, currentDay: 1 });
    }
    refresh();
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ielts-vocab-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card padding="lg">
      <h3 className="section-title">词书管理</h3>
      <p className="mt-1 text-xs muted">
        支持上传 CSV / JSON 格式词书。最少包含 day 和 word 两列,其他可选。
      </p>

      <div className="mt-3 space-y-2">
        {books.map((b) => {
          const isActive = b.id === user.activeBookId;
          const isBuiltin = b.id === MOCK_BOOK.id;
          const isEnabled = enabledIds.includes(b.id);
          return (
            <div
              key={b.id}
              className={
                isActive
                  ? "flex items-center justify-between rounded-xl border border-brand-300 bg-brand-50 px-3 py-2.5"
                  : "flex items-center justify-between rounded-xl border border-black/5 bg-bg-soft/50 px-3 py-2.5"
              }
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  disabled={isActive}
                  onChange={(e) => toggleEnabled(b.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                  title={isActive ? "当前正在学的词书必须保持启用" : "勾选后, 这本书的词会进入复习/默写全集"}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {b.name}
                    {isActive ? (
                      <span className="ml-2 pill bg-brand-100 text-brand-700">使用中</span>
                    ) : null}
                    {isBuiltin ? <span className="ml-2 pill">内置</span> : null}
                    {isEnabled && !isActive ? (
                      <span className="ml-2 pill bg-bg-soft">已纳入复习</span>
                    ) : null}
                  </div>
                  <div className="text-xs muted">共 {b.totalDays} 天</div>
                </div>
              </label>
              <div className="flex shrink-0 gap-2">
                {!isActive ? (
                  <Button variant="soft" onClick={() => switchBook(b.id)}>
                    切到这本
                  </Button>
                ) : null}
                {!isBuiltin ? (
                  <Button variant="ghost" onClick={() => removeBook(b.id)}>
                    删除
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
        <p className="text-xs muted">
          ☑ 勾选的词书会一起出现在复习箱、默写、新闻词汇等&ldquo;全集&rdquo;页面;
          重复的单词按第一次出现版本计算,不会刷两次。
          <br />
          学习进度(&ldquo;Day N&rdquo;)只跟着上方&ldquo;使用中&rdquo;的那本走。
        </p>
      </div>

      <div className="mt-5 space-y-3 rounded-xl border border-dashed border-black/10 p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">导入新词书</h4>
          <Button variant="ghost" onClick={downloadTemplate}>
            下载 CSV 模板
          </Button>
        </div>

        <div>
          <div className="text-xs muted">词书名称(可选,默认用文件名)</div>
          <input
            className="input mt-1"
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            placeholder="例如:7天搞定雅思高频核心词"
          />
        </div>

        <div>
          <div className="text-xs muted">方式 1:选择文件</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt"
            className="input mt-1"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        <div>
          <div className="text-xs muted">方式 2:直接粘贴 CSV / JSON 文本</div>
          <textarea
            className="textarea mt-1 font-mono text-xs"
            rows={5}
            placeholder={`day,word,phonetic,chinese,english,example,translation\n1,significant,/sɪɡˈnɪfɪkənt/,显著的,important and noticeable,...,...`}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <Button variant="soft" className="mt-2" onClick={handlePasteParse}>
            解析粘贴的内容
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg bg-accent-rose/10 p-2 text-xs text-accent-rose">
            ✗ {error}
          </div>
        ) : null}

        {preview ? (
          <div className="space-y-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs">
            <div className="font-medium text-brand-700">
              ✓ 解析成功:{preview.book.name}
            </div>
            <div className="text-ink-soft">
              共 {preview.words.length} 个词条 · {preview.book.totalDays} 天
            </div>
            <div className="text-ink-soft">
              首词:{preview.words.slice(0, 5).map((w) => w.word).join(" · ")}
              {preview.words.length > 5 ? " ..." : ""}
            </div>
            {warnings.length ? (
              <ul className="list-disc pl-5 text-accent-warm">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : null}
            <div className="flex gap-2 pt-1">
              <Button onClick={confirmImport}>确认导入并切换为当前词书</Button>
              <Button variant="ghost" onClick={() => setPreview(null)}>
                取消
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
