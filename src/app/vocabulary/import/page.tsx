"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AISourceBadge } from "@/components/ui/AISourceBadge";
import type { ImportedWord, VocabularyBook, Word } from "@/types";
import { storage } from "@/lib/storage";
import { useDailyTask, notifyStorageUpdated } from "@/hooks/useDailyTask";
import { extractPdfTextInBrowser } from "@/lib/pdf/extractTextClient";
import {
  renderPdfPagesInBrowser,
  type RenderedPage
} from "@/lib/pdf/renderPagesClient";

type Stage = "upload" | "extracted" | "structured" | "imported";

interface ExtractResp {
  ok: true;
  totalPages: number;
  pageRange: { from: number; to: number };
  text: string;
  textPerPage: string[];
  isProbablyScanned: boolean;
  charCountAfterTrim: number;
}

interface StructureResp {
  ok: true;
  chunks: number;
  words: ImportedWord[];
  corrections?: Array<{ from: string; to: string; reason: string }>;
}

const SCANNED_HINT =
  "这一段 PDF 文字层很少,大概率是扫描版。第一版还没接 OCR,你可以: 1) 先尝试只选有文字层的页面; 2) 等 v1.3 接入 OCR; 3) 自己复制文字粘贴到下方文本框直接走 AI 结构化。";

export default function VocabularyImportPage() {
  const { user, refresh } = useDailyTask();
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [hint, setHint] = useState("");
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState("");

  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState<{ cur: number; total: number } | null>(null);
  const [visionExtracting, setVisionExtracting] = useState(false);
  const [visionProgress, setVisionProgress] = useState<{
    phase: "render" | "ai";
    cur: number;
    total: number;
  } | null>(null);
  /** vision 识别支持断点续传:每跑完一批写入 sessionStorage,出错可暂停,稍后接着跑 */
  const [visionResume, setVisionResume] = useState<{
    fileName: string;
    fileSize: number;
    bookTitle: string;
    fromPage: number;
    toPage: number;
    nextBatchIndex: number;
    totalBatches: number;
    accumulatedWords: ImportedWord[];
    lastError?: string;
  } | null>(null);
  const [structuring, setStructuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [extracted, setExtracted] = useState<ExtractResp | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [words, setWords] = useState<ImportedWord[]>([]);
  const [corrections, setCorrections] = useState<Array<{ from: string; to: string; reason: string }>>([]);
  const [aiSource, setAiSource] = useState<"minimax" | "mock" | "loading" | null>(null);
  const [aiReason, setAiReason] = useState<string | undefined>();
  const [importedSummary, setImportedSummary] = useState<string | null>(null);

  const reset = () => {
    setStage("upload");
    setFile(null);
    setBookTitle("");
    setHint("");
    setFromPage("1");
    setToPage("");
    setExtracted(null);
    setPasteText("");
    setWords([]);
    setCorrections([]);
    setAiSource(null);
    setError(null);
    setImportedSummary(null);
  };

  const handleExtract = async () => {
    setError(null);
    if (!file) return setError("请先选择 PDF 文件");
    setExtracting(true);
    setExtractProgress(null);
    try {
      // v1.8.2: 客户端用 pdfjs-dist 提取文字, 不再上传 PDF 到 Function
      // 绕开 Netlify 6MB 请求体限制, 同时保护用户隐私(PDF 不离开浏览器)
      const fromN = Number(fromPage || "1") || 1;
      const toN = toPage ? Number(toPage) : undefined;
      const result = await extractPdfTextInBrowser(file, {
        fromPage: fromN,
        toPage: toN,
        onProgress: (cur, total) => setExtractProgress({ cur, total })
      });
      const resp: ExtractResp = {
        ok: true,
        totalPages: result.totalPages,
        pageRange: result.pageRange,
        text: result.text,
        textPerPage: result.textPerPage,
        isProbablyScanned: result.isProbablyScanned,
        charCountAfterTrim: result.charCountAfterTrim
      };
      setExtracted(resp);
      if (!bookTitle) setBookTitle(file.name.replace(/\.pdf$/i, ""));
      setStage("extracted");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExtracting(false);
      setExtractProgress(null);
    }
  };

  const VISION_RESUME_KEY = "ielts-wb:vision-resume";

  // 启动时, 如果当前选了同名同大小的文件, 自动加载之前的进度
  // 优先 sessionStorage(同 tab 续);其次 localStorage(关浏览器后再开也能续)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw =
        sessionStorage.getItem(VISION_RESUME_KEY) ||
        localStorage.getItem(VISION_RESUME_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as NonNullable<typeof visionResume>;
      setVisionResume(saved);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveVisionResume = (next: NonNullable<typeof visionResume> | null) => {
    setVisionResume(next);
    if (typeof window === "undefined") return;
    if (next) {
      const json = JSON.stringify(next);
      sessionStorage.setItem(VISION_RESUME_KEY, json);
      // 也写一份到 localStorage,关浏览器后还能续
      try {
        localStorage.setItem(VISION_RESUME_KEY, json);
      } catch {
        // localStorage 满了就忽略, sessionStorage 优先
      }
    } else {
      sessionStorage.removeItem(VISION_RESUME_KEY);
      localStorage.removeItem(VISION_RESUME_KEY);
    }
  };

  /**
   * 扫描版 PDF: 浏览器渲染每页 -> 分批送 MiniMax 视觉模型 -> 直接拿 ImportedWord[]
   *
   * 支持断点续传:
   *   - resumeFromState 为 null 时,从头开始(跑前清空缓存)
   *   - resumeFromState 不为 null 时,跳过 nextBatchIndex 之前的批次,沿用 accumulatedWords
   *   - 任何一批失败,把当前进度写回 sessionStorage 并抛出可恢复的错误,UI 显示"继续识别"按钮
   *   - 全部成功后清空缓存,跳到 structured 阶段
   */
  const handleVisionExtract = async (
    resumeFromState?: NonNullable<typeof visionResume>
  ) => {
    if (!file) return setError("请先选择 PDF 文件");
    // bug fix: 如果调用方没显式传 resume,但 state 里有可用的且文件匹配,自动接续
    // 这样 UploadStage 黄框「继续识别」按钮和底部「AI 看图识别」路径都能正确续传
    // 否则会走到 useResume=null 分支,从第 1 批重新打,浪费 vlm 配额还把进度覆盖回去
    const fallbackResume =
      !resumeFromState &&
      visionResume &&
      visionResume.fileName === file.name &&
      visionResume.fileSize === file.size
        ? visionResume
        : undefined;
    const effectiveResume = resumeFromState ?? fallbackResume;

    const useResume =
      effectiveResume &&
      effectiveResume.fileName === file.name &&
      effectiveResume.fileSize === file.size
        ? effectiveResume
        : null;

    const finalTitle =
      useResume?.bookTitle ||
      bookTitle.trim() ||
      file.name.replace(/\.pdf$/i, "");

    const fromN = useResume
      ? useResume.fromPage
      : Math.max(1, Number(fromPage) || 1);
    const toN = useResume
      ? useResume.toPage
      : toPage
        ? Number(toPage) || 0
        : 0;

    setError(null);
    setVisionExtracting(true);
    setAiSource("loading");
    setCorrections([]);

    try {
      // 1) 浏览器把每页渲染成 JPEG dataUrl
      setVisionProgress({ phase: "render", cur: 0, total: 1 });
      const rendered: RenderedPage[] = await renderPdfPagesInBrowser(file, {
        fromPage: fromN,
        toPage: toN || undefined,
        scale: 1.5,
        quality: 0.7,
        onProgress: (cur, total) =>
          setVisionProgress({ phase: "render", cur, total })
      });

      const valid = rendered.filter((p) => p.dataUrl);
      if (!valid.length) {
        throw new Error("PDF 渲染失败,没有可识别的页面");
      }

      // 2) 一张图发一次请求 (Netlify 免费版 Function 26s 上限, MiniMax VLM 单图 5-10s)
      // BATCH_SIZE=1 看似慢但避免 502 网关超时, 总耗时基本不变
      const BATCH_SIZE = 1;
      const batches: RenderedPage[][] = [];
      for (let i = 0; i < valid.length; i += BATCH_SIZE) {
        batches.push(valid.slice(i, i + BATCH_SIZE));
      }

      const startBatch = useResume?.nextBatchIndex ?? 0;
      const allWords: ImportedWord[] = useResume
        ? [...useResume.accumulatedWords]
        : [];

      for (let i = startBatch; i < batches.length; i++) {
        setVisionProgress({
          phase: "ai",
          cur: i + 1,
          total: batches.length
        });
        try {
          const r = await fetch("/api/import/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "vision",
              bookTitle: finalTitle,
              hint,
              images: batches[i].map((p) => p.dataUrl)
            })
          });
          if (!r.ok) {
            const j = (await r.json().catch(() => null)) as
              | { detail?: string; error?: string }
              | null;
            throw new Error(j?.detail || j?.error || `HTTP ${r.status}`);
          }
          const j = (await r.json()) as { ok: true; words: ImportedWord[] };
          allWords.push(...j.words);

          // 单批成功 -> 立即把累积的进度写到 sessionStorage,即使下一批 / 网络断了也不丢
          saveVisionResume({
            fileName: file.name,
            fileSize: file.size,
            bookTitle: finalTitle,
            fromPage: fromN,
            toPage: toN,
            nextBatchIndex: i + 1,
            totalBatches: batches.length,
            accumulatedWords: allWords,
            lastError: undefined
          });
        } catch (batchErr) {
          // 当前批失败 -> 保留 nextBatchIndex 在 i (下次从这一批重试)
          saveVisionResume({
            fileName: file.name,
            fileSize: file.size,
            bookTitle: finalTitle,
            fromPage: fromN,
            toPage: toN,
            nextBatchIndex: i,
            totalBatches: batches.length,
            accumulatedWords: allWords,
            lastError: (batchErr as Error).message
          });
          throw new Error(
            `第 ${i + 1}/${batches.length} 批识别失败: ${(batchErr as Error).message}\n已识别 ${allWords.length} 个词,可点"继续识别"接着跑(配额刷新后再试)`
          );
        }
      }

      // 3) 全部成功 -> 清缓存, 写 stage
      saveVisionResume(null);
      setBookTitle(finalTitle);
      setWords(allWords);
      setExtracted({
        ok: true,
        totalPages: valid.length,
        pageRange: { from: fromN, to: fromN + valid.length - 1 },
        text: "",
        textPerPage: [],
        isProbablyScanned: true,
        charCountAfterTrim: 0
      });
      setAiSource("minimax");
      setStage("structured");
    } catch (e) {
      setError((e as Error).message);
      setAiSource(null);
    } finally {
      setVisionExtracting(false);
      setVisionProgress(null);
    }
  };

  /** 用户点 "继续识别" 时调用 */
  const handleResumeVision = () => {
    if (visionResume) handleVisionExtract(visionResume);
  };

  /** 用户点 "放弃续传" 时调用 */
  const handleDiscardResume = () => {
    if (!confirm("放弃续传将丢失已识别的词条,确定继续?")) return;
    saveVisionResume(null);
  };

  const runStructure = async (rawText: string) => {
    if (!rawText.trim()) return setError("没有可用文字。请先提取或粘贴。");
    if (!bookTitle.trim()) return setError("请填写词书名称");
    setError(null);
    setStructuring(true);
    setAiSource("loading");
    try {
      const fd = new FormData();
      fd.append("action", "structure");
      fd.append("ocrText", rawText);
      fd.append("bookTitle", bookTitle.trim());
      if (hint.trim()) fd.append("hint", hint.trim());
      const r = await fetch("/api/import/pdf", { method: "POST", body: fd });
      if (r.status === 503) {
        const j = await r.json().catch(() => ({}));
        setAiSource("mock");
        setAiReason(j.detail || "未配置 MINIMAX_API_KEY");
        setWords([
          {
            word: "(mock)",
            chineseMeaning: "这是 mock 占位结果。配置 MINIMAX_API_KEY 后,这里会是 AI 提取的真实词条。",
            bookTitle,
            order: 1
          }
        ]);
        setStage("structured");
        return;
      }
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || j.error || `HTTP ${r.status}`);
      }
      const j = (await r.json()) as StructureResp;
      setWords(j.words);
      setCorrections(j.corrections ?? []);
      setAiSource("minimax");
      setStage("structured");
    } catch (e) {
      setAiSource(null);
      setError((e as Error).message);
    } finally {
      setStructuring(false);
    }
  };

  const updateWord = (idx: number, patch: Partial<ImportedWord>) => {
    setWords((arr) => arr.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  };
  const removeWord = (idx: number) => {
    setWords((arr) => arr.filter((_, i) => i !== idx));
  };

  const confirmImport = () => {
    if (!words.length) return setError("没有词条可导入");
    const cleaned = words.filter((w) => w.word.trim() && w.chineseMeaning.trim());
    if (!cleaned.length) return setError("所有词条都缺少 word 或中文释义");

    const finalTitle = bookTitle.trim() || "未命名词书";

    // v1.8.3: 优先追加到同名已有词书,而不是每次都新建
    // 这样分批用 vision 跑同一本扫描书时,可以一次次追加,不会出现 N 本同名词
    const existing = storage.getCustomBooks().find((b) => b.name === finalTitle);

    if (existing) {
      const existingWords = storage.getBookWords(existing.id);
      const existingByWord = new Map(
        existingWords.map((w) => [w.word.trim().toLowerCase(), w])
      );

      // 找出还没有的新词;同 word 跳过(去重)
      const newOnly = cleaned.filter(
        (w) => !existingByWord.has(w.word.trim().toLowerCase())
      );

      if (!newOnly.length) {
        setImportedSummary(
          `所有词条已经在「${existing.name}」中,跳过 ${cleaned.length} 个重复词。`
        );
        setStage("imported");
        return;
      }

      // v1.9: 追加也用全局 order, 不再做"找新 dayKey"的猜测逻辑
      // 已有词的最大 order 为基准, 接着往后排; Day 由 wordsPerDay 实时切片
      const existingPerDay = existing.wordsPerDay || 30;
      const maxOrder = existingWords.reduce(
        (m, w) => Math.max(m, w.order || 0),
        0
      );
      const appended: Word[] = newOnly.map((w, idx) => {
        const globalOrder = maxOrder + idx + 1;
        const dayNum = Math.floor((globalOrder - 1) / existingPerDay) + 1;
        return {
          id: `${existing.id}-w${globalOrder}`,
          word: w.word.trim(),
          phonetic: w.phonetic || "",
          chineseMeaning: w.chineseMeaning.trim(),
          englishDefinition: w.englishDefinition || "",
          exampleSentence: w.exampleSentence || "",
          bookId: existing.id,
          bookDay: dayNum,
          wordList: w.wordList || `Day ${dayNum}`,
          order: globalOrder
        };
      });

      const newTotalDays = Math.max(
        1,
        Math.ceil((existingWords.length + appended.length) / existingPerDay)
      );
      const updatedBook: VocabularyBook = {
        ...existing,
        wordsPerDay: existingPerDay,
        totalDays: newTotalDays,
        description: `从 PDF 导入,共 ${existingWords.length + appended.length} 词`
      };

      storage.saveBook(updatedBook, [...existingWords, ...appended]);
      storage.setUser({ ...user, activeBookId: existing.id });
      notifyStorageUpdated();
      refresh();

      const skipped = cleaned.length - appended.length;
      setImportedSummary(
        `已追加到「${existing.name}」: 新增 ${appended.length} 个词${skipped > 0 ? `, 跳过重复 ${skipped} 个` : ""}, 当前共 ${existingWords.length + appended.length} 词。`
      );
      setStage("imported");
      return;
    }

    // ============ 没有同名,新建一本 ============
    // v1.9: 不再按 bookDay 字段做"分 Day"逻辑(vlm 识别极不准, 会把 935 词切成 39 天每天 1 词)
    // 改为: 按全局 order 顺序入库, Day 由 wordsPerDay (默认 30) 实时切片决定。
    // 用户可以在设置页改 wordsPerDay, 立刻重切, 不需要重新导入。
    const id = `book-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const DEFAULT_WORDS_PER_DAY = 30;
    const finalWords: Word[] = cleaned.map((w, idx) => {
      const globalOrder = idx + 1;
      const dayNum = Math.floor(idx / DEFAULT_WORDS_PER_DAY) + 1;
      return {
        id: `${id}-w${globalOrder}`,
        word: w.word.trim(),
        phonetic: w.phonetic || "",
        chineseMeaning: w.chineseMeaning.trim(),
        englishDefinition: w.englishDefinition || "",
        exampleSentence: w.exampleSentence || "",
        bookId: id,
        bookDay: dayNum,
        wordList: w.wordList || `Day ${dayNum}`,
        order: globalOrder
      };
    });

    const totalDays = Math.max(
      1,
      Math.ceil(finalWords.length / DEFAULT_WORDS_PER_DAY)
    );
    const book: VocabularyBook = {
      id,
      name: finalTitle,
      totalDays,
      description: `从 PDF 导入,共 ${finalWords.length} 词`,
      wordsPerDay: DEFAULT_WORDS_PER_DAY
    };

    storage.saveBook(book, finalWords);
    storage.setUser({ ...user, activeBookId: id, currentDay: 1 });
    notifyStorageUpdated();
    refresh();

    setImportedSummary(
      `已导入「${book.name}」: ${finalWords.length} 个词,默认 ${DEFAULT_WORDS_PER_DAY} 词/天 = ${totalDays} 天,已设为当前词书。可去「设置」改每日词数。`
    );
    setStage("imported");
  };

  return (
    <Container>
      <PageHeader
        title="导入词汇书"
        subtitle="上传 PDF, 自动提取文字, AI 整理成结构化词条, 预览确认后入库"
        right={
          <Link href="/vocabulary">
            <Button variant="ghost">返回单词</Button>
          </Link>
        }
      />

      {error ? (
        <div className="mb-3 rounded-xl bg-accent-rose/10 p-3 text-sm text-accent-rose">
          ✗ {error}
        </div>
      ) : null}

      {stage === "upload" ? (
        <UploadStage
          file={file}
          setFile={setFile}
          bookTitle={bookTitle}
          setBookTitle={setBookTitle}
          hint={hint}
          setHint={setHint}
          fromPage={fromPage}
          setFromPage={setFromPage}
          toPage={toPage}
          setToPage={setToPage}
          extracting={extracting}
          extractProgress={extractProgress}
          onExtract={handleExtract}
          visionExtracting={visionExtracting}
          visionProgress={visionProgress}
          onVisionExtract={handleVisionExtract}
          visionResume={visionResume}
          clearVisionResume={() => saveVisionResume(null)}
        />
      ) : null}

      {stage === "extracted" && extracted ? (
        <ExtractedStage
          extracted={extracted}
          bookTitle={bookTitle}
          setBookTitle={setBookTitle}
          hint={hint}
          setHint={setHint}
          pasteText={pasteText}
          setPasteText={setPasteText}
          structuring={structuring}
          aiSource={aiSource}
          aiReason={aiReason}
          onBack={() => setStage("upload")}
          onStructureExtracted={() => runStructure(extracted.text)}
          onStructurePasted={() => runStructure(pasteText)}
        />
      ) : null}

      {stage === "structured" ? (
        <StructuredStage
          words={words}
          aiSource={aiSource}
          aiReason={aiReason}
          onBack={() => setStage("extracted")}
          onUpdate={updateWord}
          onRemove={removeWord}
          onConfirm={confirmImport}
        />
      ) : null}

      {stage === "imported" && importedSummary ? (
        <Card>
          <h3 className="section-title">导入完成</h3>
          <p className="mt-2 text-sm">{importedSummary}</p>
          <div className="mt-4 flex gap-2">
            <Link href="/vocabulary/learn">
              <Button variant="primary">立刻去学</Button>
            </Link>
            <Button variant="soft" onClick={reset}>
              再导入一本
            </Button>
            <Link href="/settings">
              <Button variant="ghost">在设置中管理</Button>
            </Link>
          </div>
        </Card>
      ) : null}
    </Container>
  );
}

function UploadStage(props: {
  file: File | null;
  setFile: (f: File | null) => void;
  bookTitle: string;
  setBookTitle: (s: string) => void;
  hint: string;
  setHint: (s: string) => void;
  fromPage: string;
  setFromPage: (s: string) => void;
  toPage: string;
  setToPage: (s: string) => void;
  extracting: boolean;
  extractProgress: { cur: number; total: number } | null;
  onExtract: () => void;
  visionExtracting: boolean;
  visionProgress: { phase: "render" | "ai"; cur: number; total: number } | null;
  onVisionExtract: () => void;
  visionResume: {
    fileName: string;
    fileSize: number;
    bookTitle: string;
    nextBatchIndex: number;
    totalBatches: number;
    accumulatedWords: ImportedWord[];
    lastError?: string;
  } | null;
  clearVisionResume: () => void;
}) {
  const busy = props.extracting || props.visionExtracting;
  const resume = props.visionResume;
  // 当前选中的文件是不是就是上次中断的那一个
  const canResume =
    resume && props.file
      ? resume.fileName === props.file.name && resume.fileSize === props.file.size
      : false;
  return (
    <Card padding="lg" className="space-y-4">
      <CardHeader title="第 1 步:上传 PDF" subtitle="只在你本机处理, 不会上传 GitHub" />

      <div>
        <div className="text-xs muted">PDF 文件(≤ 30MB)</div>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="input mt-1"
          onChange={(e) => props.setFile(e.target.files?.[0] || null)}
        />
        {props.file ? (
          <div className="mt-1 text-xs muted">
            {props.file.name} · {(props.file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs muted">起始页</div>
          <input
            type="number"
            min={1}
            className="input mt-1"
            value={props.fromPage}
            onChange={(e) => props.setFromPage(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs muted">结束页(留空 = 最后一页)</div>
          <input
            type="number"
            min={1}
            className="input mt-1"
            value={props.toPage}
            onChange={(e) => props.setToPage(e.target.value)}
            placeholder="例如 30"
          />
        </div>
      </div>

      <div>
        <div className="text-xs muted">词书名称(可选,默认用文件名)</div>
        <input
          className="input mt-1"
          value={props.bookTitle}
          onChange={(e) => props.setBookTitle(e.target.value)}
          placeholder="例如: 7天搞定雅思高频核心词"
        />
      </div>

      <div>
        <div className="text-xs muted">给 AI 的提示(可选)</div>
        <input
          className="input mt-1"
          value={props.hint}
          onChange={(e) => props.setHint(e.target.value)}
          placeholder="例如: 这本书每天 80 词, 分成 List A / B / C"
        />
      </div>

      {resume ? (
        <div
          className={
            canResume
              ? "rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"
              : "rounded-lg border border-black/10 bg-bg-soft p-3 text-sm"
          }
        >
          <div className="font-medium">
            上次识别到第 {resume.nextBatchIndex}/{resume.totalBatches} 批
            {resume.accumulatedWords.length > 0
              ? ` · 已暂存 ${resume.accumulatedWords.length} 个词`
              : ""}
          </div>
          <div className="mt-1 text-xs muted">
            词书: {resume.bookTitle} · 文件: {resume.fileName}
          </div>
          {resume.lastError ? (
            <div className="mt-1 text-xs text-accent-rose">
              中断原因: {resume.lastError}
            </div>
          ) : null}
          {!canResume ? (
            <div className="mt-1 text-xs text-amber-700">
              ⚠ 当前选的文件和上次不一样,无法续传。请重选同一 PDF 或点放弃续传。
            </div>
          ) : null}
          <div className="mt-2 flex gap-2">
            <Button
              variant="primary"
              onClick={props.onVisionExtract}
              disabled={!canResume || busy}
            >
              {busy ? "识别中..." : "继续识别"}
            </Button>
            <Button variant="ghost" onClick={props.clearVisionResume} disabled={busy}>
              放弃续传
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          onClick={props.onVisionExtract}
          disabled={!props.file || busy}
          title="扫描版 PDF 没有文字层时, 让 AI 直接看图识别"
        >
          {props.visionExtracting
            ? props.visionProgress
              ? props.visionProgress.phase === "render"
                ? `渲染图片... ${props.visionProgress.cur}/${props.visionProgress.total}`
                : `AI 识别中... 第 ${props.visionProgress.cur}/${props.visionProgress.total} 批`
              : "AI 看图中..."
            : "AI 看图识别(扫描件)"}
        </Button>
        <Button onClick={props.onExtract} disabled={!props.file || busy}>
          {props.extracting
            ? props.extractProgress
              ? `正在提取... ${props.extractProgress.cur}/${props.extractProgress.total} 页`
              : "正在提取..."
            : "提取文字"}
        </Button>
      </div>
    </Card>
  );
}

function ExtractedStage(props: {
  extracted: ExtractResp;
  bookTitle: string;
  setBookTitle: (s: string) => void;
  hint: string;
  setHint: (s: string) => void;
  pasteText: string;
  setPasteText: (s: string) => void;
  structuring: boolean;
  aiSource: "minimax" | "mock" | "loading" | null;
  aiReason?: string;
  onBack: () => void;
  onStructureExtracted: () => void;
  onStructurePasted: () => void;
}) {
  const e = props.extracted;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="第 2 步:文字提取结果"
          subtitle={`总页数 ${e.totalPages}, 已读取第 ${e.pageRange.from}-${e.pageRange.to} 页, 共 ${e.charCountAfterTrim} 字`}
        />
        {e.isProbablyScanned ? (
          <div className="mt-3 rounded-xl bg-accent-warm/10 p-3 text-sm">
            <div className="font-medium text-accent-warm">这一段可能是扫描版 PDF</div>
            <p className="mt-1 muted">{SCANNED_HINT}</p>
          </div>
        ) : null}
        <textarea
          readOnly
          className="textarea mt-3 font-mono text-xs"
          rows={10}
          value={e.text || "(空)"}
        />
      </Card>

      <Card padding="lg" className="space-y-3">
        <CardHeader
          title="第 3 步:让 AI 结构化"
          subtitle="AI 会从原始文字中识别出 word / 中文 / 音标 / 例句, 生成 ImportedWord[]"
        />

        <div>
          <div className="text-xs muted">词书名称(必填)</div>
          <input
            className="input mt-1"
            value={props.bookTitle}
            onChange={(e2) => props.setBookTitle(e2.target.value)}
          />
        </div>
        <div>
          <div className="text-xs muted">给 AI 的提示(可选)</div>
          <input
            className="input mt-1"
            value={props.hint}
            onChange={(e2) => props.setHint(e2.target.value)}
            placeholder="例如: 这是 7 天 PDF, 每天 80 词"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={props.onStructureExtracted}
            disabled={!e.text || props.structuring}
          >
            {props.structuring ? "AI 处理中..." : "用 AI 整理上面提取的文字"}
          </Button>
          {props.aiSource ? (
            <AISourceBadge source={props.aiSource} reason={props.aiReason} />
          ) : null}
        </div>

        <div className="rounded-xl border border-dashed border-black/10 p-3">
          <div className="text-xs muted">或者: 自己粘贴文字给 AI 整理(扫描版可在外部 OCR 后粘贴这里)</div>
          <textarea
            className="textarea mt-2 font-mono text-xs"
            rows={6}
            value={props.pasteText}
            onChange={(e2) => props.setPasteText(e2.target.value)}
            placeholder="把任意原始文字粘贴这里..."
          />
          <Button
            variant="soft"
            className="mt-2"
            onClick={props.onStructurePasted}
            disabled={!props.pasteText.trim() || props.structuring}
          >
            用 AI 整理粘贴的内容
          </Button>
        </div>

        <div className="flex justify-start">
          <Button variant="ghost" onClick={props.onBack}>
            ← 返回上一步
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StructuredStage(props: {
  words: ImportedWord[];
  aiSource: "minimax" | "mock" | "loading" | null;
  aiReason?: string;
  onBack: () => void;
  onUpdate: (idx: number, patch: Partial<ImportedWord>) => void;
  onRemove: (idx: number) => void;
  onConfirm: () => void;
}) {
  return (
    <Card padding="lg" className="space-y-3">
      <div className="flex items-center justify-between">
        <CardHeader
          title="第 4 步:预览 + 编辑"
          subtitle={`共 ${props.words.length} 个词条, 可以行内修改、删除, 确认无误后导入`}
        />
        {props.aiSource ? (
          <AISourceBadge source={props.aiSource} reason={props.aiReason} />
        ) : null}
      </div>

      <div className="overflow-auto rounded-xl border border-black/5">
        <table className="w-full text-xs">
          <thead className="bg-bg-soft text-ink-soft">
            <tr>
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">word</th>
              <th className="px-2 py-2 text-left">phonetic</th>
              <th className="px-2 py-2 text-left">中文</th>
              <th className="px-2 py-2 text-left">例句</th>
              <th className="px-2 py-2 text-left">Day</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {props.words.map((w, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="px-2 py-1 text-ink-soft tabular-nums">{i + 1}</td>
                <td className="px-2 py-1">
                  <input
                    className="w-full bg-transparent px-1 py-0.5 outline-none focus:bg-bg-soft/60"
                    value={w.word}
                    onChange={(e) => props.onUpdate(i, { word: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full bg-transparent px-1 py-0.5 font-mono outline-none focus:bg-bg-soft/60"
                    value={w.phonetic || ""}
                    onChange={(e) => props.onUpdate(i, { phonetic: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full bg-transparent px-1 py-0.5 outline-none focus:bg-bg-soft/60"
                    value={w.chineseMeaning}
                    onChange={(e) =>
                      props.onUpdate(i, { chineseMeaning: e.target.value })
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full bg-transparent px-1 py-0.5 outline-none focus:bg-bg-soft/60"
                    value={w.exampleSentence || ""}
                    onChange={(e) =>
                      props.onUpdate(i, { exampleSentence: e.target.value })
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-16 bg-transparent px-1 py-0.5 outline-none focus:bg-bg-soft/60"
                    value={w.bookDay || ""}
                    onChange={(e) => props.onUpdate(i, { bookDay: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1 text-right">
                  <button
                    className="text-accent-rose hover:underline"
                    onClick={() => props.onRemove(i)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={props.onBack}>
          ← 返回修改
        </Button>
        <Button onClick={props.onConfirm}>确认导入并切换为当前词书</Button>
      </div>
    </Card>
  );
}
