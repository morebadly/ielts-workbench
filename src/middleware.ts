import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 给 HTML 文档强制 no-cache, 解决浏览器/nginx 把老 HTML 当 long-cache 的问题。
 *
 * 关键: 用 set 而不是 append, 覆盖 Next.js 预渲染时打的 s-maxage=31536000 头。
 * 否则两份 Cache-Control 同时返回, 中间层会优先采纳 s-maxage 那份, no-cache 形同虚设。
 *
 * 静态资源 (/_next/static/*, /_next/image, /api/*) 由 matcher 排除, 各自维持原 header。
 * version.txt 单独 no-store, 让 VersionCheck 总能拿到最新版本号。
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (pathname === "/version.txt") {
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  }

  // set (不是 append) — 覆盖掉 Next 自己打的 s-maxage=31536000
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|favicon\\.ico).*)"
  ]
};
