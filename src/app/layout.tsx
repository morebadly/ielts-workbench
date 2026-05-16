import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BottomTab } from "@/components/layout/BottomTab";
import { VersionCheck } from "@/components/layout/VersionCheck";

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
