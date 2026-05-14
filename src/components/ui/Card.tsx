import { cn } from "@/lib/utils";
import type { HTMLAttributes, PropsWithChildren } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const PAD = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-8"
};

export function Card({
  className,
  padding = "md",
  children,
  ...rest
}: PropsWithChildren<CardProps>) {
  return (
    <div className={cn("card", PAD[padding], className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="section-title">{title}</h3>
        {subtitle ? <p className="text-sm muted mt-0.5">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
