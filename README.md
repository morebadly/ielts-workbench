# IELTS Workbench

个人雅思学习工作台。第一版聚焦三件事:**单词、写作、听力**。

## 技术栈
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- PWA (manifest + 可添加到桌面)
- 数据持久化:第一版用 `localStorage`,后续可平滑迁移到 Supabase

## 启动
```bash
npm install
npm run dev
```

打开 http://localhost:3000

## 功能模块
- 首页 Dashboard:今日任务 / 进度 / 连续天数 / 继续学习
- Vocabulary:词书顺序学习 / 卡片 / TTS / 怎么读 / 默写四种 / 词汇文章
- Writing:格式指导 + 范文结构 / 句子 / 段落 / 机考模拟
- Listening:轻量精听
- Review:复习箱(简化 SRS)
- Settings:词书选择 / 每日任务量 / 数据导出导入

## 项目结构
见 `src/` 下分层目录。所有可替换的部分(TTS / 怎么读 / 批改 / 文章生成)都封装在 `src/lib/`,后续接 AI API 只改这一层。

## 后续扩展
- 接 Supabase / Auth(已为 `localStorage` 包装统一接口)
- 接 AI 批改(`lib/grading.ts` 中已留 `aiGrade()` 占位)
- 真实雅思音频素材(替换 `data/mockListening.ts`)
