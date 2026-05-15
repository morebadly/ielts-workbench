/**
 * scripts/lib/loadEnv.ts
 * tsx 不像 Next.js 那样自动加载 .env.local, 需要手动读取。
 * 优先级: 已有 process.env > .env.local > .env
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // 去掉成对的引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadLocalEnv(cwd: string = process.cwd()): { loaded: string[] } {
  const candidates = [".env.local", ".env"];
  const loaded: string[] = [];
  for (const name of candidates) {
    const file = path.join(cwd, name);
    if (!existsSync(file)) continue;
    try {
      const parsed = parseDotEnv(readFileSync(file, "utf8"));
      for (const [k, v] of Object.entries(parsed)) {
        if (process.env[k] === undefined || process.env[k] === "") {
          process.env[k] = v;
        }
      }
      loaded.push(name);
    } catch (e) {
      console.warn(`[loadEnv] failed to load ${name}:`, (e as Error).message);
    }
  }
  return { loaded };
}
