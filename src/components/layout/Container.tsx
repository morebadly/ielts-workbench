import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Container({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl px-4 pb-24 pt-4 sm:px-6 md:pb-12",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm muted mt-1">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
