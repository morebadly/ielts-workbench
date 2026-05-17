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
import { callAI, type GenerateExampleData, type PosLookupData } from "@/lib/ai/client";
import { ChineseMeaningParts } from "@/components/vocabulary/ChineseMeaningParts";

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
  // v1.10.4: 改成 state, 跑批量补词性 / 例句时能从 storage 重新加载实时显示
  const [allWords, setAllWords] = useState<Word[]>(() => loadBookWords(book));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setAllWords(loadBookWords(book)), [book.id]);
  const reloadWords = () => setAllWords(loadBookWords(book));
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");
  // v1.10.2: 批量 AI 生成例句 —— 支持暂停/继续, 跨刷新仍能从上次位置接着跑
  // 已生成的词在 wordExamples 缓存里, 这里只额外记录"是否处于暂停状态"用于 UI
  const PAUSE_KEY = `ielts-wb:example-batch-paused:${book.id}`;
  const [genState, setGenState] = useState<{
    running: boolean;
    cur: number;
    total: number;
    skipped: number;
    failed: number;
    paused: boolean;
    /** 当前取消请求模式, 反应到 UI 让用户看到 "暂停中..." */
    cancelMode: "none" | "pause" | "stop";
  } | null>(null);
  // 用 string 而非字面量联合, 避免 TS 控制流分析在赋值后窄化掉, 造成假阳性 "类型不重叠" 报错
  const cancelRef = useRef<string>("none");

  useEffect(() => {
    setPage(0);
    setFilter("");
    // 切换书时, 检查这本书是否上次有暂停 -> 显示"继续生成"提示
    if (typeof window !== "undefined" && localStorage.getItem(PAUSE_KEY)) {
      setGenState({
        running: false,
        cur: 0,
        total: 0,
        skipped: 0,
        failed: 0,
        paused: true,
        cancelMode: "none"
      });
    } else {
      setGenState(null);
    }
    // 同步: 词性批量任务也可能有暂停标记
    if (typeof window !== "undefined" && localStorage.getItem(POS_PAUSE_KEY)) {
      setPosState({
        running: false,
        cur: 0,
        total: 0,
        skipped: 0,
        failed: 0,
        paused: true,
        cancelMode: "none"
      });
    } else {
      setPosState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  // 已经有缓存例句的词数
  const examplesCached = useMemo(() => {
    const map = storage.getWordExamples();
    return allWords.filter((w) => !!map[w.id]).length;
  }, [allWords, genState?.cur, genState?.paused]);

  const runBatchExamples = async () => {
    if (genState?.running) return;
    cancelRef.current = "none";
    const map = storage.getWordExamples();
    const targets = allWords.filter(
      (w) => !w.exampleSentence && !map[w.id]
    );
    if (!targets.length) {
      alert("所有词都已有例句(原始或 AI 生成),无需再跑");
      try {
        localStorage.removeItem(PAUSE_KEY);
      } catch {
        // 忽略
      }
      setGenState(null);
      return;
    }
    const isResume = !!localStorage.getItem(PAUSE_KEY);
    if (
      !isResume &&
      !confirm(
        `准备给 ${targets.length} 个还没例句的词调 AI 生成例句, 大约耗时 ${Math.ceil(targets.length * 1.5 / 60)} 分钟。期间可以"暂停"保存进度后下次接着跑, 或"取消"完全停止。\n\n继续?`
      )
    )
      return;
    // 标记本书有进行中的批量任务
    try {
      localStorage.setItem(PAUSE_KEY, "1");
    } catch {
      // 忽略
    }
    setGenState({
      running: true,
      cur: 0,
      total: targets.length,
      skipped: 0,
      failed: 0,
      paused: false,
      cancelMode: "none"
    });
    let skipped = 0;
    let failed = 0;
    let done = 0;
    // v1.10.4: 5 路并发池
    const CONCURRENCY = 5;
    let cursor = 0;
    const runOne = async () => {
      while (cursor < targets.length && cancelRef.current === "none") {
        const i = cursor++;
        const w = targets[i];
        const latest = storage.getWordExamples();
        if (latest[w.id]) {
          skipped++;
          done++;
          setGenState((s) => (s ? { ...s, cur: done, skipped, failed } : s));
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
            failed++;
          }
        } catch {
          failed++;
        }
        done++;
        setGenState((s) => (s ? { ...s, cur: done, skipped, failed } : s));
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => runOne())
    );

    const reason = cancelRef.current;
    cancelRef.current = "none";
    notifyStorageUpdated();
    if (reason === "pause") {
      // 暂停: 保留 PAUSE_KEY, UI 显示"继续生成"
      setGenState({
        running: false,
        cur: 0,
        total: 0,
        skipped: 0,
        failed: 0,
        paused: true,
        cancelMode: "none"
      });
    } else {
      // 全部跑完 / 用户取消 -> 清掉暂停标记
      try {
        localStorage.removeItem(PAUSE_KEY);
      } catch {
        // 忽略
      }
      setGenState({
        running: false,
        cur: targets.length,
        total: targets.length,
        skipped,
        failed,
        paused: false,
        cancelMode: "none"
      });
      setTimeout(() => setGenState(null), 6000);
    }
  };

  const pauseBatch = () => {
    cancelRef.current = "pause";
    setGenState((s) => (s ? { ...s, paused: true, cancelMode: "pause" } : s));
  };
  const stopBatch = () => {
    if (!confirm("取消会清除续传进度, 下次重新开始(已生成的例句仍保留)。\n\n确认取消?"))
      return;
    cancelRef.current = "stop";
    setGenState((s) => (s ? { ...s, cancelMode: "stop" } : s));
  };

  // ----- v1.10.3: 批量 AI 补词性 -----
  // 跟批量生成例句独立: 直接修改 word.chineseMeaning 写回 bookWords (内置书不可写)
  const POS_PAUSE_KEY = `ielts-wb:pos-batch-paused:${book.id}`;
  const [posState, setPosState] = useState<{
    running: boolean;
    cur: number;
    total: number;
    skipped: number;
    failed: number;
    paused: boolean;
    cancelMode: "none" | "pause" | "stop";
  } | null>(null);
  const posCancelRef = useRef<string>("none");

  // 这本书里"看起来没词性"的词数 —— 启发式: 中文不以词性前缀开头就算缺
  const POS_PREFIX = /^(n\.|v\.|vt\.|vi\.|adj\.|adv\.|prep\.|conj\.|pron\.|art\.|num\.|phr\.|phrase|abbr\.)/i;

  /**
   * v1.10.5: 把 AI 返回的两个字段合并成"v. 释义"格式。
   *
   * 之前的判定只接受 chineseMeaning 自带前缀的情况, 但 MiniMax-M2.7 是 reasoning
   * 模型, 同一份 prompt 经常出现:
   *   1) {partOfSpeech:"v.", chineseMeaning:"离弃; 放弃"}    — 字段拆开了, 没合并
   *   2) {partOfSpeech:"verb", chineseMeaning:"离弃..."}    — 写英文全称
   *   3) {partOfSpeech:"v., n.", chineseMeaning:"v. 处理; n. 用具"} — 已经合并好
   * 三种我们都视为成功, 客户端按需拼接。
   */
  function buildCombinedMeaning(
    pos: string,
    meaning: string
  ): string | null {
    const m = (meaning || "").trim();
    if (!m) return null;
    // 情况 3: meaning 自带前缀 → 直接用
    if (POS_PREFIX.test(m)) return m;
    // 情况 1/2: pos 单独存在, 客户端拼
    const p = (pos || "").trim();
    if (!p) return null;
    // 把 verb / noun 等英文全称归一化到 v. / n.
    const normalized = p
      .replace(/\bverb\b/gi, "v.")
      .replace(/\bnoun\b/gi, "n.")
      .replace(/\badjective\b/gi, "adj.")
      .replace(/\badverb\b/gi, "adv.")
      .replace(/\bpreposition\b/gi, "prep.")
      .replace(/\bconjunction\b/gi, "conj.")
      .replace(/\bpronoun\b/gi, "pron.")
      .replace(/\barticle\b/gi, "art.")
      .replace(/\bphrase\b/gi, "phr.")
      .replace(/\s+/g, " ")
      .trim();
    // 缩写后面没点的也补上, 例如 "v" → "v."
    const fixed = normalized.replace(
      /\b(n|v|vt|vi|adj|adv|prep|conj|pron|art|num|aux|phr)(?!\.)\b/gi,
      "$1."
    );
    if (!POS_PREFIX.test(fixed) && !/^[a-z]{1,5}\.\s*(,\s*[a-z]{1,5}\.\s*)*$/i.test(fixed)) {
      // 既不是单个 v./n. 也不是 "v., n." 形式, 大概率是垃圾, 放弃
      return null;
    }
    return `${fixed} ${m}`.replace(/\s+/g, " ").trim();
  }

  const posMissing = useMemo(() => {
    return allWords.filter((w) => !POS_PREFIX.test(w.chineseMeaning.trim())).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords, posState?.cur, posState?.paused]);

  const isBuiltinBook = book.id === MOCK_BOOK.id;

  const runBatchPos = async () => {
    if (posState?.running || genState?.running) {
      alert("有其他批量任务进行中, 请先暂停或等待完成");
      return;
    }
    if (isBuiltinBook) {
      alert("内置词书不可修改, 词性已经是完整的");
      return;
    }
    posCancelRef.current = "none";
    // 重新读最新词列表 (避免旧 allWords 闭包)
    const freshWords = storage.getBookWords(book.id);
    if (!freshWords.length) {
      alert("这本书没有词");
      return;
    }
    const targets = freshWords
      .map((w, idx) => ({ w, idx }))
      .filter(({ w }) => !POS_PREFIX.test(w.chineseMeaning.trim()));
    if (!targets.length) {
      alert("所有词都已经有词性, 无需再跑");
      try {
        localStorage.removeItem(POS_PAUSE_KEY);
      } catch {
        // ignore
      }
      setPosState(null);
      return;
    }
    const isResume = !!localStorage.getItem(POS_PAUSE_KEY);
    if (
      !isResume &&
      !confirm(
        `准备给 ${targets.length} 个缺词性的词调 AI 补词性 (写回原书的 chineseMeaning)。预计 ${Math.ceil(
          targets.length * 1.5 / 60
        )} 分钟。可以"暂停"保存进度后下次接着跑。\n\n继续?`
      )
    )
      return;
    try {
      localStorage.setItem(POS_PAUSE_KEY, "1");
    } catch {
      // ignore
    }
    setPosState({
      running: true,
      cur: 0,
      total: targets.length,
      skipped: 0,
      failed: 0,
      paused: false,
      cancelMode: "none"
    });

    let skipped = 0;
    let failed = 0;
    let done = 0;
    // 操作的对象: 完整 freshWords 数组的一份拷贝, 边跑边改边存
    const working = freshWords.slice();
    // v1.10.4: 5 路并发池, MiniMax 限速大约 5-10 QPS, 5 路安全且把时间砍 5 倍
    const CONCURRENCY = 5;
    let cursor = 0;
    const runOne = async () => {
      while (cursor < targets.length && posCancelRef.current === "none") {
        const i = cursor++;
        const { w, idx } = targets[i];
        // 双重检查: 这个词是否在另一处已经被改过
        if (POS_PREFIX.test(working[idx].chineseMeaning.trim())) {
          skipped++;
          done++;
          setPosState((s) =>
            s ? { ...s, cur: done, skipped, failed } : s
          );
          continue;
        }
        const fallback = (): PosLookupData => ({
          partOfSpeech: "",
          chineseMeaning: w.chineseMeaning
        });
        try {
          const r = await callAI(
            "posLookup",
            { word: w.word, chineseMeaning: w.chineseMeaning },
            fallback
          );
          if (r.source === "minimax") {
            const combined = buildCombinedMeaning(
              r.data.partOfSpeech,
              r.data.chineseMeaning
            );
            if (combined && POS_PREFIX.test(combined)) {
              working[idx] = { ...working[idx], chineseMeaning: combined };
            } else {
              failed++;
              if (failed <= 5) {
                console.warn(
                  `[posLookup] 拼接失败 word=${w.word} pos=${JSON.stringify(r.data.partOfSpeech)} cn=${JSON.stringify(r.data.chineseMeaning)}`
                );
              }
            }
          } else {
            failed++;
            if (failed <= 5) {
              console.warn(
                `[posLookup] AI 调用失败 word=${w.word} reason=${r.reason} code=${r.errorCode}`
              );
            }
          }
        } catch (e) {
          failed++;
          if (failed <= 5) {
            console.warn(`[posLookup] 异常 word=${w.word}`, e);
          }
        }
        done++;
        // v1.10.5: 写盘 + 刷表频率从 20 提到 5 (= CONCURRENCY 一轮),
        // 视觉上接近"补一个显示一个", 同时避免每次都序列化整个词表 (3000+ 词约 200KB)
        if (done % 5 === 0) {
          storage.setBookWords(book.id, working);
          reloadWords();
        }
        setPosState((s) =>
          s ? { ...s, cur: done, skipped, failed } : s
        );
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => runOne())
    );
    // 跑完/中断都先把当前进度落盘
    storage.setBookWords(book.id, working);
    reloadWords();

    const reason = posCancelRef.current;
    posCancelRef.current = "none";
    notifyStorageUpdated();

    if (reason === "pause") {
      setPosState({
        running: false,
        cur: 0,
        total: 0,
        skipped: 0,
        failed: 0,
        paused: true,
        cancelMode: "none"
      });
    } else {
      try {
        localStorage.removeItem(POS_PAUSE_KEY);
      } catch {
        // ignore
      }
      setPosState({
        running: false,
        cur: targets.length,
        total: targets.length,
        skipped,
        failed,
        paused: false,
        cancelMode: "none"
      });
      // 全部成功才自动消失, 有失败要让用户看到 / 自己关
      if (failed === 0) {
        setTimeout(() => setPosState(null), 6000);
      }
    }
  };

  const pausePos = () => {
    posCancelRef.current = "pause";
    setPosState((s) => (s ? { ...s, paused: true, cancelMode: "pause" } : s));
  };
  const stopPos = () => {
    if (!confirm("取消会清除续传进度, 下次重新开始(已修正的词性会保留)。\n\n确认取消?"))
      return;
    posCancelRef.current = "stop";
    setPosState((s) => (s ? { ...s, cancelMode: "stop" } : s));
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
          {!isBuiltinBook && posMissing > 0 ? ` · 缺词性 ${posMissing}` : ""}
        </div>
        <div className="flex items-center gap-2">
          {genState?.running ? (
            <>
              <Button
                variant="ghost"
                onClick={pauseBatch}
                disabled={genState.cancelMode !== "none"}
              >
                {genState.cancelMode === "pause" ? "暂停中..." : "暂停"}
              </Button>
              <Button
                variant="ghost"
                onClick={stopBatch}
                disabled={genState.cancelMode !== "none"}
              >
                {genState.cancelMode === "stop" ? "停止中..." : "取消"}
              </Button>
            </>
          ) : null}
          {posState?.running ? (
            <>
              <Button
                variant="ghost"
                onClick={pausePos}
                disabled={posState.cancelMode !== "none"}
              >
                {posState.cancelMode === "pause" ? "暂停中..." : "暂停"}
              </Button>
              <Button
                variant="ghost"
                onClick={stopPos}
                disabled={posState.cancelMode !== "none"}
              >
                {posState.cancelMode === "stop" ? "停止中..." : "取消"}
              </Button>
            </>
          ) : null}
          <Button
            variant="soft"
            onClick={runBatchExamples}
            disabled={!!genState?.running || !!posState?.running}
          >
            {genState?.running
              ? `生成中 ${genState.cur}/${genState.total}`
              : genState?.paused
                ? "继续生成例句"
                : "AI 批量生成例句"}
          </Button>
          {!isBuiltinBook ? (
            <div className="flex flex-col gap-0.5">
              <Button
                variant="soft"
                onClick={runBatchPos}
                disabled={!!posState?.running || !!genState?.running}
              >
                {posState?.running
                  ? `补词性中 ${posState.cur}/${posState.total}`
                  : posState?.paused
                    ? "继续补词性"
                    : "AI 批量补词性"}
              </Button>
              {posState?.running && (posState.failed > 0 || posState.skipped > 0) ? (
                <div className="text-[10px] muted">
                  失败 {posState.failed} · 跳过 {posState.skipped}
                </div>
              ) : null}
            </div>
          ) : null}
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
      {genState && !genState.running && genState.paused ? (
        <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          ⏸ 上次批量生成被暂停,已生成 {examplesCached}/{allWords.length} 个例句。
          点上方「继续生成例句」从未生成的词接着跑,关浏览器/重启电脑都不会丢。
        </div>
      ) : null}
      {posState && !posState.running && posState.paused ? (
        <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          ⏸ 上次批量补词性被暂停,目前还有 {posMissing}/{allWords.length} 个词缺词性。
          点上方「继续补词性」从剩余的词接着跑。
        </div>
      ) : null}
      {posState && !posState.running && !posState.paused && posState.total > 0 ? (
        posState.failed > 0 ? (
          // 有失败 -> 琥珀横幅, 不自动消失, 显式关闭按钮 + F12 提示
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <div className="flex-1">
              ⚠ 词性补全完成, 但有 <b>{posState.failed}</b> 个词没补上 (跳过 {posState.skipped}, 总 {posState.total})。
              <br />
              通常是 AI 偶发返回格式不规范, 再点一次「AI 批量补词性」就会只对剩下的词重跑。
              想看具体哪些词失败 → 按 F12 → Console, 找 <code className="rounded bg-amber-200/50 px-1">[posLookup]</code> 开头的日志(只打前 5 条)。
            </div>
            <button
              type="button"
              className="shrink-0 rounded px-2 py-0.5 text-xs hover:bg-amber-200/60"
              onClick={() => setPosState(null)}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="mb-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs">
            ✓ 词性修正结束: 处理 {posState.total} 个, 跳过 {posState.skipped}, 全部补全成功。
          </div>
        )
      ) : null}
      {genState && !genState.running && !genState.paused && genState.total > 0 ? (
        <div className="mb-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs">
          ✓ 批量生成结束: 处理 {genState.total} 个,跳过 {genState.skipped},失败{" "}
          {genState.failed}
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
                    <td className="px-2 py-1">
                      <ChineseMeaningParts text={w.chineseMeaning} compact />
                    </td>
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
