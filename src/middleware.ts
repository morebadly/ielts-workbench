import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 给 HTML 文档强制 no-cache, 解决浏览器把老 HTML 当 200 OK 长期缓存
 * 导致部署新 chunk 后页面还是引用旧 chunk URL 的问题。
 *
 * 静态资源 (/_next/static/*, /favicon, /assets) Next.js 自己会打 immutable 长缓存,
 * 它们靠文件名 hash 保证内容不变, 不需要也不应该被这层覆盖。
 *
 * version.txt 单独 no-store, 让 VersionCheck 总能拿到最新版本号。
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (pathname === "/version.txt") {
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  }

  // 其他所有命中这层的路径(由 matcher 排除掉了静态资源)都设 no-cache
  res.headers.set("Cache-Control", "no-cache, must-revalidate");
  return res;
}

export const config = {
  // 排除 _next/static/* (immutable 长缓存)、_next/image、API 路由(由各自处理)、favicon
  matcher: [
    "/((?!_next/static|_next/image|api|favicon\\.ico).*)"
  ]
};
