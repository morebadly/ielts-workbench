# IELTS Workbench

个人雅思学习工作台。第一版聚焦三件事:**单词、写作、听力**。

---

## 当前版本: v1.5.0

**已完成:**
- 首页 Dashboard:今日 6 项任务 / 词书进度 / 连续天数 / 继续学习
- 单词:按 Day 顺序学习 / 卡片 / Web Speech TTS / 三档反馈触发简化 SRS / **AI 怎么读** / **AI 造句点评**
- 默写:听音写词 / 中译英 / 句子挖空 / 听句默写,基础批改 + **AI 错因解释**
- 词汇文章:高亮今日词 / 全文播放 / **AI 重新生成今日文章**
- 写作:格式指导 + Task1/Task2 范文结构 / 句子训练(**AI 点评**)/ 段落训练
- 写作机考模拟:倒计时 / 字数 / 段落与空行检测 / **AI 批改**(Task1 / Task2 各自维度 + 改写版)
- 听力精听:四步流程,听 → 听写 → 原文 → 收生词
- 复习箱 / 设置(词书 Day / 任务量 / 英美音 / 数据导出导入)
- **MiniMax 文本能力**全部接入,前端零直连(走 Next.js API Route 转发)

---

## 技术栈

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- PWA(`manifest.json` + 图标,可"添加到主屏幕")
- 数据持久化:`localStorage` 统一封装(`lib/storage.ts`),后续可平滑迁移 Supabase
- AI Provider:**MiniMax**,统一封装在 `lib/ai/`

---

## 启动

```bash
npm install
cp .env.example .env.local      # 然后把你的 MiniMax API Key 填进去
npm run dev
```

打开 http://localhost:3000

### 每日新闻

```bash
npm run update:news
```

无 `MINIMAX_API_KEY` 时会落到 mock fallback;配了 Key 会用 MiniMax 生成 learning summary。GitHub Actions 每日 23:00 UTC(次日 07:00 北京时间)自动跑并提交。

### 多设备同步(可选)

如果只在一台设备用,直接跳过这一节,数据全部存在 `localStorage`。

要在电脑和手机之间同步学习进度:

1. 去 https://supabase.com 建一个免费项目
2. 打开 SQL Editor,把 `supabase/schema.sql` 整段贴进去执行
3. 复制项目的 **URL** 和 **anon public key**(`Settings -> API`),粘到 `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

4. 重启 dev 后,打开「设置」页,会出现「云同步账号」和「云同步」两张卡。注册一个邮箱(开发期可以在 Supabase Dashboard `Authentication -> Providers` 里临时关掉邮箱验证),登录,点「同步」即可。

> 注意:**绝不要把 service role key 写进任何前端环境变量**,RLS 已经限制每个用户只能读写自己的行。

---

## MiniMax API Key 配置

1. 拷贝模板:`cp .env.example .env.local`
2. 在 `.env.local` 中填入真实 Key:

   ```env
   MINIMAX_API_KEY=你的真实apikey
   MINIMAX_BASE_URL=https://api.minimax.io/v1
   MINIMAX_CHAT_PATH=/chat/completions
   MINIMAX_TEXT_MODEL=MiniMax-M2.7
   MINIMAX_TTS_MODEL=speech-02-hd
   ```
3. 重启 dev server 让环境变量生效。
4. 如果未配置 Key,所有 AI 功能会自动回落到本地 mock,功能不会崩。

**安全规则(项目内自动保证)**

- `.env.local` 已在 `.gitignore` 中,不会上传 GitHub
- `.env.example` 会上传,不含真实 Key
- 前端**绝对不直连** MiniMax,所有调用都经过 `/api/ai/chat`(Node runtime)中转
- 真实 Key 只在 Server 端读取,浏览器端拿不到

---

## AI Provider 架构

```
浏览器 (页面组件)
   │ fetch('/api/ai/chat', { capability, payload })
   ▼
Next.js API Route  (src/app/api/ai/chat/route.ts)
   │ 读取 process.env.MINIMAX_API_KEY
   ▼
MiniMax Provider   (src/lib/ai/minimax.ts)
   │ POST {baseUrl}/text/chatcompletion_v2
   ▼
MiniMax 服务
```

**已实现的能力**(`capability` 字段):

| capability | 用途 | 调用位置 |
|---|---|---|
| `pronunciation` | 单词读法讲解(音节/重音/中文提示/误读) | 单词卡片 |
| `sentenceFeedback` | 单词造句 / 整句翻译批改 | 单词卡片、句子训练 |
| `dictationFeedback` | 默写错因解释 + 记忆提示 | 默写页 |
| `vocabArticle` | 根据今日词生成 120–180 词 IELTS 文章 | 词汇文章页 |
| `writingTask1` | Task 1 批改(overview/趋势/数据/比较/改写) | 机考模拟 |
| `writingTask2` | Task 2 批改(立场/论证/逻辑/词汇/改写) | 机考模拟 |

**TTS 接口**(`/api/ai/tts`)已预留,v1.0 仍走浏览器 Web Speech API。后续在 `lib/ai/minimax.ts` 的 `synthesizeTTS()` 内调用 MiniMax `t2a_v2` 即可切换。

---

## 项目结构

```
src/
├── app/                  # 页面 + API Route
│   ├── api/ai/chat/      # AI 文本能力转发
│   └── api/ai/tts/       # AI TTS 接口预留
├── components/
├── data/                 # mock 词书 / 文章 / 写作 / 听力素材
├── hooks/
├── lib/
│   ├── ai/
│   │   ├── minimax.ts    # Server-only Provider
│   │   ├── prompts.ts    # 6 个 Prompt 模板
│   │   └── client.ts     # 浏览器侧 fetch 封装(无 key 自动 mock)
│   ├── storage.ts        # localStorage 统一访问层
│   ├── srs.ts            # 间隔复习
│   ├── grading.ts        # 默写本地批改
│   └── tts.ts            # 浏览器 Web Speech API
└── types/
```

---

## 版本历史

- **v0.9** — 雅思学习工作台首版功能完成(无 AI 接入,使用 mock)
- **v1.0** — 接入 MiniMax Provider,6 个文本能力可用,前端零直连
- **v1.0.1** — 修复每日任务量保存反馈、跨页同步、首页加快捷调节卡片
- **v1.1** — 自定义词书导入(CSV/JSON)+ 词书管理 UI
- **v1.2** — 上传 PDF 自动提取单词,AI 结构化预览确认后入库
- **v1.3.0** — MiniMax 集成与 CI 稳定性补丁
  - 修复 MiniMax OpenAI-compatible endpoint 配置(`/chat/completions`)
  - 增加 AI 返回结果 zod 校验(`schemas.ts` + `validateAIResult`)
  - AI 失败时显示明确的 mock 来源、错误码与原因(`AIResultNotice`)
  - 修复 localStorage 导入安全:白名单 keys, 返回 imported/skipped
  - 增加 GitHub Actions CI(lint + build)
- **v1.4.0** — 每日英文新闻学习模块
  - 新增 `/news` 列表 + `/news/today` 一站式学习 + `/news/[id]` 单条视图
  - 每条新闻配 AI 学习摘要、5 个 IELTS 词汇、3 道阅读题、Task 2 写作题、TTS 听力文本
  - 词汇可一键加入复习箱,写作题可直接跳转 `/writing/exam` 并预填题面
  - 首页 Dashboard 顶部显示当日新闻入口
  - 新增 `scripts/update-daily-news.ts`,无 Key 时自动 mock fallback
  - 新增 GitHub Actions `daily-news.yml`,每日 7:00(北京时间)自动跑脚本并 commit
  - **版权策略**:不抓取/保存正文,只保存标题、来源、URL、发布时间、原始 RSS 摘要;learning summary 明确标注由 AI 生成
- **v1.5.0** — Supabase 多设备同步(可选)
  - 新增 `supabase/schema.sql`(`user_sync_items` JSONB 表 + RLS + auto `updated_at` 触发器)
  - 新增 `src/lib/supabase/client.ts` 单例(未配置时返回 null,纯本地模式仍可用)
  - 新增 `src/lib/sync/cloudSync.ts`:`pushAll` / `pullAll` / `syncTwoWay` / `clearCloudData`,只同步白名单 keys
  - 新增 `useAuth` / `useCloudSync` hooks,`AuthCard` / `SyncCard` UI 组件,接入设置页
  - `storage` 扩 `SyncMeta` + `exportSyncSnapshot` + `applySyncSnapshot`,旧 API 不变
  - 仅使用 anon key,不引入 service role,RLS 限制用户只能读写自己的行
- **v1.5.0** — Supabase 多设备同步(可选)
  - 新增 `supabase/schema.sql`(`user_sync_items` 表 + RLS 策略 + auto-touch 触发器)
  - 邮箱密码注册 / 登录(`useAuth`),session 自动持久化
  - 同步引擎 `cloudSync.ts`:`pushAll` / `pullAll` / `syncTwoWay` / `clearCloudData`
  - 设置页加 `AuthCard` + `SyncCard`:上传 / 下载 / 同步 / 上次同步时间徽标
  - localStorage 全部 8 个 key 走白名单,云端同名 upsert,本地始终保留
  - 未配置 Supabase 时全站完全本地模式,UI 给出明确提示
  - **凭据策略**:仅使用 `NEXT_PUBLIC_SUPABASE_URL` 与 `ANON_KEY`,绝不引入 service role,所有数据隔离都靠 RLS

---

## 下一步计划

- 接入 MiniMax TTS:替换浏览器 Web Speech,统一英音 / 美音音色
- 把雅思核心 3000 完整词书塞进 `data/`
- 真实雅思音频素材替换 `mockListening.ts`
- 复习箱算法升级(SM-2 / FSRS)
- 写作历史回看 + 进步曲线
- 同步策略升级:按 key 的 last-write-wins,目前是简化版双向同步

---

## Git 工作流约定

- 每完成一个版本:`git add . && git commit && git tag vX.Y && git push --tags`
- 每次提交前必查:`git status` 确认没有 `.env.local`
- 真实 Key **不进** GitHub
