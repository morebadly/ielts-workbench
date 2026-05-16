// build 前自动生成版本号:
// 1. 写到 public/version.txt (供客户端 fetch 对比)
// 2. 写到 .env.production.local 的 NEXT_PUBLIC_VERSION (注入 bundle 让客户端能读自己的版本)
// 部署后 5 分钟内,所有打开的页面会自动检测到版本变更并刷新。
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

let version;
try {
  version = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
} catch {
  version = Date.now().toString(36);
}
const ts = new Date().toISOString();
const fullId = `${version}-${Date.now()}`;

const publicDir = path.resolve("public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "version.txt"), fullId + "\n");

// .env.production.local 优先级最高, 不会污染 .env.local
const envFile = path.resolve(".env.production.local");
let envContent = "";
if (fs.existsSync(envFile)) {
  envContent = fs.readFileSync(envFile, "utf-8");
  envContent = envContent
    .split("\n")
    .filter((line) => !line.startsWith("NEXT_PUBLIC_VERSION="))
    .join("\n");
  if (envContent && !envContent.endsWith("\n")) envContent += "\n";
}
envContent += `NEXT_PUBLIC_VERSION=${fullId}\n`;
fs.writeFileSync(envFile, envContent);

console.log(`[prebuild] version = ${fullId} (built at ${ts})`);
