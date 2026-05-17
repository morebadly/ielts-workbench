"use client";

import { Card } from "@/components/ui/Card";
import type { ExamQuestion, ExamQuestionGroup } from "@/types";

interface QuestionGroupProps {
  group: ExamQuestionGroup;
  answers: Record<string, string>;
  onChange: (qId: string, value: string) => void;
  /** 是否在结果页 (会显示对错 + 标准答案) */
  reviewMode?: boolean;
  /** 判分函数, 仅 reviewMode 用 */
  isCorrect?: (q: ExamQuestion, userInput: string) => boolean;
}

/**
 * 一组题的通用渲染组件, 阅读和听力共用。
 * 根据 question.type 渲染不同的输入控件:
 *   tfng / ynng              -> 三选一 radio
 *   multipleChoice           -> 单选 ABCD
 *   matchHeadings / matchFeatures -> 下拉选 (用 sharedOptions)
 *   shortAnswer / sentenceComplete / summaryComplete /
 *   formComplete / noteComplete / tableComplete       -> 文本输入框
 *   mapLabel                 -> 文本输入框 (后续可换为 svg 标注)
 */
export function QuestionGroupBlock({
  group,
  answers,
  onChange,
  reviewMode = false,
  isCorrect
}: QuestionGroupProps) {
  return (
    <Card className="mb-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold">{group.range}</h4>
        <p className="mt-1 text-sm muted whitespace-pre-line">
          {group.instruction}
        </p>
      </div>

      {group.sharedOptions && group.sharedOptions.length > 0 ? (
        <div className="mb-3 rounded-md bg-bg-soft p-3 text-sm">
          {group.sharedOptions.map((opt, i) => (
            <p key={i} className="leading-relaxed">
              {opt}
            </p>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        {group.questions.map((q) => (
          <SingleQuestion
            key={q.id}
            question={q}
            value={answers[q.id] ?? ""}
            sharedOptions={group.sharedOptions}
            onChange={(v) => onChange(q.id, v)}
            reviewMode={reviewMode}
            correct={
              reviewMode && isCorrect
                ? isCorrect(q, answers[q.id] ?? "")
                : undefined
            }
          />
        ))}
      </div>
    </Card>
  );
}

interface SingleQuestionProps {
  question: ExamQuestion;
  value: string;
  sharedOptions?: string[];
  onChange: (v: string) => void;
  reviewMode?: boolean;
  correct?: boolean;
}

function SingleQuestion({
  question,
  value,
  sharedOptions,
  onChange,
  reviewMode = false,
  correct
}: SingleQuestionProps) {
  const t = question.type;
  const disabled = reviewMode;

  return (
    <div className="border-l-2 border-bg-soft pl-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-brand-700">
          {question.number}.
        </span>
        <p className="text-sm leading-relaxed">{question.prompt}</p>
      </div>
      {question.wordLimit ? (
        <p className="mt-0.5 pl-6 text-xs muted">{question.wordLimit}</p>
      ) : null}

      <div className="mt-2 pl-6">
        {t === "tfng" ? (
          <RadioRow
            options={["TRUE", "FALSE", "NOT GIVEN"]}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        ) : t === "ynng" ? (
          <RadioRow
            options={["YES", "NO", "NOT GIVEN"]}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        ) : t === "multipleChoice" && question.options ? (
          <RadioRow
            options={question.options.map((_, i) =>
              String.fromCharCode(65 + i)
            )}
            labels={question.options}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        ) : (t === "matchHeadings" ||
            t === "matchFeatures" ||
            t === "matchInfo") &&
          sharedOptions ? (
          <select
            className="rounded-md border border-black/10 bg-white px-2 py-1 text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">— 选择 —</option>
            {sharedOptions.map((opt, i) => {
              const code = opt.match(/^([A-Z]|[ivxlcdm]+)\.?\s/i);
              const tag = code ? code[1] : String.fromCharCode(65 + i);
              return (
                <option key={i} value={tag}>
                  {opt}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            type="text"
            className="w-full max-w-md rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="输入答案"
          />
        )}
      </div>

      {reviewMode ? (
        <div className="mt-2 pl-6 text-xs">
          {correct ? (
            <span className="text-emerald-700">✓ 正确</span>
          ) : (
            <span className="text-rose-700">
              ✗ 你的答案: {value || "(未答)"} · 正确答案:{" "}
              {Array.isArray(question.answer)
                ? question.answer.join(" / ")
                : question.answer}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RadioRow({
  options,
  labels,
  value,
  onChange,
  disabled
}: {
  options: string[];
  labels?: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {options.map((opt, i) => (
        <label
          key={opt}
          className={`flex items-baseline gap-1.5 text-sm ${
            disabled ? "opacity-60" : "cursor-pointer"
          }`}
        >
          <input
            type="radio"
            checked={value === opt}
            onChange={() => onChange(opt)}
            disabled={disabled}
          />
          <span>
            <strong>{opt}</strong>
            {labels && labels[i] && labels[i] !== opt ? (
              <span className="ml-1 muted">{labels[i]}</span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}
