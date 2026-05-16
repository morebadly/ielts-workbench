import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BottomTab } from "@/components/layout/BottomTab";
import { VersionCheck } from "@/components/layout/VersionCheck";

// 关掉 Next.js 全站预渲染 + 1 年 s-maxage 默认头。
// 应用绝大多数数据 (单词进度 / 词书 / 设置) 都在 localStorage, SSG 拿不到没意义,
// 反而会被中间层 (nginx / Edge) 当 "1 年内有效" 缓存住, 部署新版死活不刷新。
// 改 force-dynamic 后, 每次请求 Next 都会用 "no-store" 头返回新 HTML。
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "IELTS Workbench",
  description: "个人雅思学习工作台 — 单词、写作、听力",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IELTS"
  }
};

export const viewport: Viewport = {
  themeColor: "#4F7A57",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-screen bg-bg text-ink">
        <Navbar />
        <main>{children}</main>
        <BottomTab />
        <VersionCheck />
      </body>
    </html>
  );
}
