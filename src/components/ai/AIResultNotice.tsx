import { cn } from "@/lib/utils";

interface Props {
  source: "minimax" | "mock" | "loading" | null;
  reason?: string;
  errorCode?: string;
  className?: string;
}

export function AIResultNotice({ source, reason, errorCode, className }: Props) {
  if (!source) return null;

  if (source === "loading") {
    return (
      <span
        className={cn(
          "pill bg-accent-warm/15 text-accent-warm text-[11px]",
          className
        )}
      >
        AI 思考中…
      </span>
    );
  }

  if (source === "minimax") {
    return (
      <span
        className={cn(
          "pill bg-brand-100 text-brand-700 text-[11px]",
          className
        )}
        title={reason || "由 MiniMax 实时生成"}
      >
        MiniMax
      </span>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-accent-warm/30 bg-accent-warm/10 px-3 py-2 text-xs text-accent-warm",
        className
      )}
      role="status"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">当前展示的是 mock 结果</span>
        {errorCode ? (
          <span className="pill bg-bg-card text-ink-soft text-[10px]">
            {errorCode}
          </span>
        ) : null}
      </div>
      {reason ? (
        <div className="mt-1 text-[11px] text-ink-soft break-all">
          {reason}
        </div>
      ) : null}
    </div>
  );
}
