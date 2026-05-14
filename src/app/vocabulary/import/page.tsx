"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AISourceBadge } from "@/components/ui/AISourceBadge";
import type { ImportedWord, VocabularyBook, Word } from "@/types";
import { storage } from "@/lib/storage";
import { useDailyTask, notifyStorageUpdated } from "@/hooks/useDailyTask";

type Stage = "upload" | "extracted" | "structured" | "imported";

interface ExtractResp {
  ok: true;
  totalPages: number;
  pageRange: { from: number; to: number };
  text: string;
  textPerPage: string[];
  isProbablyScanned: boolean;
  charCount: number;
}

interface StructureResp {
  ok: true;
  chunks: number;
  words: ImportedWord[];
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
  const [structuring, setStructuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [extracted, setExtracted] = useState<ExtractResp | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [words, setWords] = useState<ImportedWord[]>([]);
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
    setAiSource(null);
    setError(null);
    setImportedSummary(null);
  };

  const handleExtract = async () => {
    setError(null);
    if (!file) return setError("请先选择 PDF 文件");
    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("action", "extract");
      fd.append("fromPage", fromPage || "1");
      if (toPage) fd.append("toPage", toPage);
      const r = await fetch("/api/import/pdf", { method: "POST", body: fd });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || j.error || `HTTP ${r.status}`);
      }
      const j = (await r.json()) as ExtractResp;
      setExtracted(j);
      if (!bookTitle) setBookTitle(file.name.replace(/\.pdf$/i, ""));
      setStage("extracted");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExtracting(false);
    }
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

    const dayMap = new Map<string, number>();
    let nextDay = 1;
    const dayCounters = new Map<number, number>();

    const id = `book-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const finalWords: Word[] = cleaned.map((w, idx) => {
      const dayKey = (w.bookDay || `Day ${nextDay}`).trim();
      let dayNum = dayMap.get(dayKey);
      if (dayNum === undefined) {
        dayNum = nextDay++;
        dayMap.set(dayKey, dayNum);
      }
      const order = (dayCounters.get(dayNum) || 0) + 1;
      dayCounters.set(dayNum, order);
      return {
        id: `${id}-d${dayNum}-${idx + 1}`,
        word: w.word.trim(),
        phonetic: w.phonetic || "",
        chineseMeaning: w.chineseMeaning.trim(),
        englishDefinition: w.englishDefinition || "",
        exampleSentence: w.exampleSentence || "",
        bookId: id,
        bookDay: dayNum,
        wordList: w.wordList || dayKey,
        order
      };
    });

    const totalDays = Math.max(...finalWords.map((w) => w.bookDay), 1);
    const book: VocabularyBook = {
      id,
      name: bookTitle.trim(),
      totalDays,
      description: `从 PDF 导入,共 ${finalWords.length} 词`
    };

    storage.saveBook(book, finalWords);
    storage.setUser({ ...user, activeBookId: id, currentDay: 1 });
    notifyStorageUpdated();
    refresh();

    setImportedSummary(
      `已导入「${book.name}」: ${finalWords.length} 个词,${totalDays} 天,已设为当前词书。`
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
          onExtract={handleExtract}
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
  onExtract: () => void;
}) {
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

      <div className="flex justify-end">
        <Button onClick={props.onExtract} disabled={!props.file || props.extracting}>
          {props.extracting ? "正在提取..." : "提取文字"}
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
          subtitle={`总页数 ${e.totalPages}, 已读取第 ${e.pageRange.from}-${e.pageRange.to} 页, 共 ${e.charCount} 字`}
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
