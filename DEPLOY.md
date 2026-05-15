# 部署到 Vercel

ielts-workbench 是个标准 Next.js App Router 项目,可直接部署。

## 一次性准备

### 1. 把仓库推到 GitHub

已经推了。仓库地址:`https://github.com/morebadly/ielts-workbench`

### 2. 在 Vercel 建项目

1. 打开 https://vercel.com/new
2. 选 `morebadly/ielts-workbench` 仓库
3. Framework 自动识别为 Next.js,**不要改任何 build 配置**
   - Build Command 默认: `next build`
   - Output: `.next` (无需改动)
   - Node.js: 20.x

### 3. 配置环境变量(必填)

在 Vercel → Project → Settings → Environment Variables 加:

| Key | Value | Scope |
| --- | --- | --- |
| `MINIMAX_API_KEY` | 你的 MiniMax key | Production + Preview |
| `MINIMAX_GROUP_ID` | 你的 GroupId(国内站 TTS 必填) | Production + Preview |
| `MINIMAX_BASE_URL` | `https://api.minimax.io/v1`(国际)或 `https://api.minimaxi.com/v1`(国内) | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Production + Preview |

**绝不要**填 `service_role` key 或任何写权限敏感凭据 —— 数据隔离全靠 Supabase RLS。

### 4. 在 Supabase SQL Editor 跑一次 schema

把 `supabase/schema.sql` 的内容粘进 SQL Editor 跑一次。包含:
- `user_sync_items` 表
- `client_modified_at` 列(v1.8.0 last-write-wins 用)
- RLS 策略

可重复执行。

### 5. 点 Deploy

Vercel 会自动 build → 部署 → 给你一个 `xxx.vercel.app` 域名。

## 上线后验证

访问 `/api/health`,应返回:

```json
{
  "ok": true,
  "service": "ielts-workbench",
  "env": {
    "minimaxConfigured": true,
    "supabaseConfigured": true,
    "vercel": true
  }
}
```

如果 `minimaxConfigured` 是 `false`,说明环境变量没生效,检查 Vercel Settings。

## Cron(每日新闻)

GitHub Actions 已经在仓库里跑 `daily-news.yml`,每天凌晨自动 commit 到 main 分支,触发 Vercel 重新部署。**不需要在 Vercel 配 Cron**。

如果想换成 Vercel Cron,新建 `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-news",
      "schedule": "0 23 * * *"
    }
  ]
}
```

但那需要再加一个 `/api/cron/daily-news` route,目前没必要。

## 生产环境预检清单

- [ ] `package.json` version 与 README 一致(当前 v1.8.1)
- [ ] `npx next build` 本地通过
- [ ] `.env.local` 不在 git 历史里(`.gitignore` 已忽略)
- [ ] Supabase RLS 已启用,匿名访客不能读其他用户数据
- [ ] MiniMax key 有余额
- [ ] 任意一台浏览器跑过完整流程:登录 → 写一篇作文 → 看 AI 高亮 → 同步 → 切到另一设备拉数据
- [ ] `/api/health` 返回所有 env 都是 `true`

## 常见问题

**Q: 部署后 TTS 没声音?**
A: 检查 `MINIMAX_GROUP_ID`。国内站 t2a_v2 必须带 GroupId。可在 `/api/health` 看 `minimaxConfigured`,但 GroupId 缺失只能从 502 报错里看出。

**Q: 同步报"未配置 Supabase"?**
A: 两个 `NEXT_PUBLIC_` 变量必须都填。注意 anon key 不是 service_role key。

**Q: 自定义域名怎么配?**
A: Vercel → Settings → Domains 加域名,按提示设 DNS。Cloudflare 走 Proxy 模式 OK。

**Q: 数据会丢吗?**
A: 数据全在用户浏览器 localStorage + Supabase。重新部署不影响数据。Vercel 项目本身只是无状态计算层。
