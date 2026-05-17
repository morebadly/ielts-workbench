"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/vocabulary", label: "单词" },
  { href: "/writing", label: "写作" },
  { href: "/listening", label: "听力" },
  { href: "/test-bank", label: "真题" },
  { href: "/review", label: "复习" },
  { href: "/settings", label: "设置" }
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 hidden border-b border-black/5 bg-bg/80 backdrop-blur md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white font-serif">
            IE
          </span>
          <span className="font-medium tracking-wide">IELTS Workbench</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((it) => {
            const active =
              it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition",
                  active ? "bg-brand-100 text-brand-700" : "text-ink-soft hover:bg-bg-soft"
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
