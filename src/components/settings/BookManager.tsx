"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storage } from "@/lib/storage";
import { getAllBooks, MOCK_BOOK, MOCK_WORDS } from "@/data/mockWords";
import {
  BookParseError,
  CSV_TEMPLATE,
  parseAuto,
  type ParsedBook
} from "@/lib/bookImport";
import type { VocabularyBook, UserProgress, Word } from "@/types";
import { notifyStorageUpdated } from "@/hooks/useDailyTask";
import { callAI, type GenerateExampleData } from "@/lib/ai/client";

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
  const [viewBookId, setViewBookId] = useState<string | null>(null);
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

  const renameBook = (book: VocabularyBook) => {
    if (book.id === MOCK_BOOK.id) return;
    const next = window.prompt("新词书名称:", book.name);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) {
      alert("名称不能为空");
      return;
    }
    if (trimmed === book.name) return;
    if (books.some((b) => b.id !== book.id && b.name === trimmed)) {
      alert("已经有同名词书,换一个名字");
      return;
    }
    storage.updateBookMeta(book.id, { name: trimmed });
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
            <div key={b.id} className="space-y-2">
              <div
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
                <Button
                  variant="ghost"
                  onClick={() =>
                    setViewBookId(viewBookId === b.id ? null : b.id)
                  }
                  title="查看这本书里的所有词"
                >
                  {viewBookId === b.id ? "收起" : "查看词汇"}
                </Button>
                {!isActive ? (
                  <Button variant="soft" onClick={() => switchBook(b.id)}>
                    切到这本
                  </Button>
                ) : null}
                {!isBuiltin ? (
                  <Button variant="ghost" onClick={() => renameBook(b)}>
                    重命名
                  </Button>
                ) : null}
                {!isBuiltin ? (
                  <Button variant="ghost" onClick={() => removeBook(b.id)}>
                    删除
                  </Button>
                ) : null}
              </div>
            </div>
            {viewBookId === b.id ? (
              <BookWordsPreview book={b} />
            ) : null}
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

const PAGE_SIZE = 30;

function loadBookWords(book: VocabularyBook): Word[] {
  if (book.id === MOCK_BOOK.id) {
    return MOCK_WORDS.filter((w) => w.bookId === book.id).slice().sort((a, b) => {
      if (a.bookDay !== b.bookDay) return a.bookDay - b.bookDay;
      return a.order - b.order;
    });
  }
  return storage.getBookWords(book.id).slice().sort((a, b) => {
    if (a.bookDay !== b.bookDay) return a.bookDay - b.bookDay;
    return a.order - b.order;
  });
}

function BookWordsPreview({ book }: { book: VocabularyBook }) {
  // book.id 唯一标识一本书, 同 id 的 book 对象内容必相同, 不需要 book 整体作依赖
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allWords = useMemo(() => loadBookWords(book), [book.id]);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");
  // v1.10.2: 批量 AI 生成例句
  const [genState, setGenState] = useState<{
    running: boolean;
    cur: number;
    total: number;
    skipped: number;
    failed: number;
    cancel: boolean;
  } | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    setPage(0);
    setFilter("");
  }, [book.id]);

  // 已经有缓存例句的词数, 用来给批量按钮显示进度提示
  const examplesCached = useMemo(() => {
    const map = storage.getWordExamples();
    return allWords.filter((w) => !!map[w.id]).length;
  }, [allWords, genState?.cur]);

  const runBatchExamples = async () => {
    if (genState?.running) return;
    cancelRef.current = false;
    const map = storage.getWordExamples();
    const targets = allWords.filter(
      (w) => !w.exampleSentence && !map[w.id]
    );
    if (!targets.length) {
      alert("所有词都已有例句(原始或 AI 生成),无需再跑");
      return;
    }
    if (
      !confirm(
        `准备给 ${targets.length} 个还没例句的词调 AI 生成例句, 大约耗时 ${Math.ceil(targets.length * 1.5 / 60)} 分钟。期间可以点"取消"中止。\n\n继续?`
      )
    )
      return;
    setGenState({
      running: true,
      cur: 0,
      total: targets.length,
      skipped: 0,
      failed: 0,
      cancel: false
    });
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      if (cancelRef.current) break;
      const w = targets[i];
      // 双重检查: 这一秒可能其他 tab 已经写过缓存
      const latest = storage.getWordExamples();
      if (latest[w.id]) {
        skipped++;
        setGenState((s) =>
          s ? { ...s, cur: i + 1, skipped: s.skipped + 1 } : s
        );
        continue;
      }
      const fallback = (): GenerateExampleData => ({
        exampleSentence: `${w.word} is commonly used in academic English.`,
        exampleTranslation: `${w.chineseMeaning.split(/[;,。;,]/)[0] || w.word} 在学术英语中很常用。`,
        memoryTip: ""
      });
      try {
        const r = await callAI(
          "generateExample",
          {
            word: w.word,
            chineseMeaning: w.chineseMeaning,
            phonetic: w.phonetic
          },
          fallback
        );
        if (r.source === "minimax") {
          storage.setWordExample(w.id, r.data);
        } else {
          // mock fallback 不缓存, 否则下次永远不再尝试 AI
          failed++;
        }
      } catch {
        failed++;
      }
      setGenState((s) =>
        s
          ? {
              ...s,
              cur: i + 1,
              skipped,
              failed
            }
          : s
      );
    }
    const finalState = {
      running: false,
      cur: targets.length,
      total: targets.length,
      skipped,
      failed,
      cancel: cancelRef.current
    };
    setGenState(finalState);
    notifyStorageUpdated();
    setTimeout(() => setGenState(null), 6000);
  };

  const cancelBatch = () => {
    cancelRef.current = true;
    setGenState((s) => (s ? { ...s, cancel: true } : s));
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allWords;
    return allWords.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.chineseMeaning.toLowerCase().includes(q)
    );
  }, [allWords, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-black/5 bg-bg-card p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs muted">
          共 {allWords.length} 词
          {filter ? ` · 筛选后 ${filtered.length} 词` : ""} · 第 {safePage + 1}/
          {totalPages} 页 · 已生成例句 {examplesCached}
        </div>
        <div className="flex items-center gap-2">
          {genState?.running ? (
            <Button variant="ghost" onClick={cancelBatch} disabled={genState.cancel}>
              {genState.cancel ? "停止中..." : "取消"}
            </Button>
          ) : null}
          <Button
            variant="soft"
            onClick={runBatchExamples}
            disabled={!!genState?.running}
          >
            {genState?.running
              ? `生成中 ${genState.cur}/${genState.total}`
              : "AI 批量生成例句"}
          </Button>
          <input
            className="input h-8 w-48 text-xs"
            placeholder="搜词或中文..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>
      {genState && !genState.running ? (
        <div className="mb-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs">
          ✓ 批量生成结束: 处理 {genState.total} 个,跳过 {genState.skipped},失败{" "}
          {genState.failed}
          {genState.cancel ? " (用户取消)" : ""}
        </div>
      ) : null}
      {/* 固定 min-height 防止翻页时高度跳变, 浏览器 scroll restoration 把视口拉走 */}
      <div className="min-h-[600px]">
        {slice.length ? (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-bg-soft text-ink-soft">
                <tr>
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="px-2 py-1.5 text-left">word</th>
                  <th className="px-2 py-1.5 text-left">phonetic</th>
                  <th className="px-2 py-1.5 text-left">中文</th>
                  <th className="px-2 py-1.5 text-left">Day</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((w, i) => (
                  <tr key={w.id} className="border-t border-black/5">
                    <td className="px-2 py-1 text-ink-soft tabular-nums">
                      {safePage * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-2 py-1 font-medium">{w.word}</td>
                    <td className="px-2 py-1 font-mono text-ink-soft">
                      {w.phonetic}
                    </td>
                    <td className="px-2 py-1">{w.chineseMeaning}</td>
                    <td className="px-2 py-1 tabular-nums text-ink-soft">
                      {w.bookDay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-center text-xs muted">没有匹配的词</div>
        )}
      </div>
      {totalPages > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          <Button
            variant="ghost"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
          >
            ← 上一页
          </Button>
          <span className="muted tabular-nums">
            {safePage + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage >= totalPages - 1}
          >
            下一页 →
          </Button>
        </div>
      ) : null}
    </div>
  );
}
