import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BottomTab } from "@/components/layout/BottomTab";
import { VersionCheck } from "@/components/layout/VersionCheck";

// 注: 不再用 export const dynamic = "force-dynamic"
// 之前是为了禁掉 Next SSG 默认打的 s-maxage=31536000 头, 但代价是每次路由切换都要 SSR,
// 用户切「单词」「写作」等页时肉眼可见地卡。
// 现在反代缓存(nginx proxy_cache)在站点 conf 已关闭, middleware 又强制覆盖 Cache-Control 为 no-store,
// 所以 Next 内部那个 s-maxage 头实际上对任何缓存层都不生效, 可以放心走 SSG 享受秒切。

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
