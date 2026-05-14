import { cn } from "@/lib/utils";

export function AISourceBadge({
  source,
  reason
}: {
  source: "minimax" | "mock" | "loading";
  reason?: string;
}) {
  const map = {
    minimax: { label: "MiniMax", cls: "bg-brand-100 text-brand-700" },
    mock: { label: "Mock", cls: "bg-bg-soft text-ink-soft" },
    loading: { label: "AI 思考中…", cls: "bg-accent-warm/15 text-accent-warm" }
  } as const;
  const cfg = map[source];
  return (
    <span
      className={cn("pill text-[11px]", cfg.cls)}
      title={reason || (source === "minimax" ? "由 MiniMax 生成" : undefined)}
    >
      {cfg.label}
    </span>
  );
}
