"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "首页", icon: "●" },
  { href: "/vocabulary", label: "单词", icon: "✎" },
  { href: "/writing", label: "写作", icon: "✏" },
  { href: "/listening", label: "听力", icon: "♪" },
  { href: "/test-bank", label: "真题", icon: "▤" },
  { href: "/settings", label: "我的", icon: "☰" }
];

export function BottomTab() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/5 bg-bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-6">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex">
              <Link
                href={t.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs",
                  active ? "text-brand-600" : "text-ink-muted"
                )}
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
