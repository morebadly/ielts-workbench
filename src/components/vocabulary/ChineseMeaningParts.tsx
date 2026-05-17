/**
 * v1.10.5: 共享的"带词性 pill 的中文释义"渲染组件。
 * 之前只在 WordCard 里有, BookManager 的词汇表格直接渲染纯文本所以看不到词性。
 *
 * 解析规则:
 *   - 识别开头的 "v. " / "n. " / "adj. " / "adv. " / "prep. " / "conj. " / "phr. " / "phrase " (大小写不敏感)
 *   - 多词性多义项 (例如 "v. 处理; n. 用具") 会拆成多个块
 *   - 检测不到词性 -> 整段当裸释义显示, 跟原来一致
 */
"use client";

interface Props {
  text: string;
  /** 紧凑模式:pill 字号更小, 用于密集表格行 */
  compact?: boolean;
}

const POS_PATTERN =
  /\b(n|v|vt|vi|adj|adv|prep|conj|pron|art|num|aux|phr|phrase)\.?\s*/i;

interface PosSegment {
  pos: string | null;
  meaning: string;
}

function parsePosSegments(text: string): PosSegment[] {
  if (!text) return [];
  const parts = text
    .split(/[;;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return [];
  const result: PosSegment[] = [];
  for (const part of parts) {
    const m = part.match(new RegExp("^" + POS_PATTERN.source));
    if (m) {
      const posRaw = m[1].toLowerCase();
      const pos = posRaw.endsWith(".") ? posRaw : posRaw + ".";
      const meaning = part.slice(m[0].length).trim();
      if (meaning) {
        result.push({ pos, meaning });
        continue;
      }
    }
    result.push({ pos: null, meaning: part });
  }
  if (result.every((r) => r.pos === null)) return [];
  return result;
}

export function ChineseMeaningParts({ text, compact = false }: Props) {
  const segments = parsePosSegments(text);
  if (segments.length === 0) {
    return <span>{text}</span>;
  }
  const pillClass = compact
    ? "rounded bg-brand-100 px-1 py-0 font-mono text-[10px] font-medium leading-4 text-brand-700"
    : "rounded-md bg-brand-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-brand-700";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {segments.map((seg, i) => (
        <span key={i} className="inline-flex items-baseline gap-1">
          {seg.pos ? <span className={pillClass}>{seg.pos}</span> : null}
          <span>{seg.meaning}</span>
        </span>
      ))}
    </span>
  );
}
