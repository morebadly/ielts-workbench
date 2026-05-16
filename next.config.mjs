/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 把 build ID 绑定到 NEXT_PUBLIC_VERSION (commit + 时间戳, 由 prebuild 脚本写入)。
  // 好处: 每次部署所有 chunk 文件名都变, Next.js 客户端 router cache 自动失效,
  //       站内 SPA 跳转 (Link 点击) 一定会拉新 chunk, 不会复用 prefetch 时的旧 chunk。
  generateBuildId: async () => {
    return process.env.NEXT_PUBLIC_VERSION || `dev-${Date.now()}`;
  },
  experimental: {
    typedRoutes: false,
    serverComponentsExternalPackages: ["pdf-parse"]
  }
};

export default nextConfig;
