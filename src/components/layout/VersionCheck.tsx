"use client";

import { useEffect, useRef } from "react";

/**
 * 版本检测 + 自动刷新
 * - 挂载时拉一次 /version.txt, 跟 bundle 内置的 NEXT_PUBLIC_VERSION 对比
 * - 之后每 5 分钟轮询一次, 长时间挂着的页面也能拿到新版
 * - 检测到版本变更 → 弹原生 confirm(避免无脑刷掉用户输入到一半的内容)
 *   - 用户接受 → location.reload()
 *   - 拒绝 → 这次会话不再提示, 等下次进站
 *
 * 跟 service worker 不同: 这是纯客户端逻辑, 不缓存任何东西, 只是"检测到新版告知"
 */
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟
const STORAGE_KEY = "ielts-wb:dismissed-version";

export function VersionCheck() {
  const dismissedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const myVersion = process.env.NEXT_PUBLIC_VERSION;
    if (!myVersion) return; // dev 环境没注入

    try {
      dismissedRef.current = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    let cancelled = false;

    const check = async () => {
      try {
        const r = await fetch(`/version.txt?t=${Date.now()}`, {
          cache: "no-store"
        });
        if (!r.ok) return;
        const remoteVersion = (await r.text()).trim();
        if (cancelled || !remoteVersion) return;
        if (remoteVersion === myVersion) return;
        if (remoteVersion === dismissedRef.current) return;

        // 有新版, 提示用户
        const accept = window.confirm(
          "检测到新版本,刷新页面以使用最新功能?\n(取消则本次会话内不再提示)"
        );
        if (accept) {
          // 用 query string cache-buster 跳转, 强制绕开任何中间缓存层
          // (浏览器 / nginx proxy_cache / CDN), 比 location.reload() 更可靠
          const url = new URL(window.location.href);
          url.searchParams.set("_v", remoteVersion);
          window.location.href = url.toString();
        } else {
          dismissedRef.current = remoteVersion;
          try {
            sessionStorage.setItem(STORAGE_KEY, remoteVersion);
          } catch {
            // ignore
          }
        }
      } catch {
        // 离线或 nginx 暂时不可达, 静默
      }
    };

    // 启动后 3 秒做第一次检查 (避免和首屏渲染争 cpu)
    const initialTimer = window.setTimeout(check, 3000);
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    // 标签页重新可见时也检查一次
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
