import { cn } from "@/lib/utils";

interface Props {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ value, max, className, showLabel, label }: Props) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {showLabel ? (
        <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
          <span>{label}</span>
          <span>
            {value}/{max}
          </span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-soft">
        <div
          className="h-full rounded-full bg-brand-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
