import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "soft" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

const MAP: Record<Variant, string> = {
  primary: "btn-primary",
  soft: "btn-soft",
  ghost: "btn-ghost"
};

export function Button({
  variant = "primary",
  full,
  className,
  children,
  type,
  ...rest
}: PropsWithChildren<Props>) {
  return (
    <button
      type={type ?? "button"}
      className={cn(MAP[variant], full && "w-full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
