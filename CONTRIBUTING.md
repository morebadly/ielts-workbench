# Contributing

这份说明用于帮助新成员以统一方式参与 `ielts-workbench` 的开发。

## 1. 第一次获取项目

```bash
git clone https://github.com/morebadly/ielts-workbench.git
cd ielts-workbench
git status
```

## 2. 开始任务前同步 main

```bash
git switch main
git pull
```

## 3. 为任务创建分支

不要直接在 `main` 上进行日常开发。

推荐命名：

- 新功能：`feature/xxx`
- 修复：`fix/xxx`
- 文档：`docs/xxx`
- 重构：`refactor/xxx`

例如：

```bash
git switch -c docs/git-onboarding
```

## 4. 提交前检查

```bash
git status
git diff
```

确认没有无关修改、临时文件或敏感信息后再暂存。

## 5. 暂存并提交

```bash
git add CONTRIBUTING.md
git commit -m "docs: add contributor Git workflow"
```

提交信息尽量说明“这次修改做了什么”，例如：

- `feat: add article search`
- `fix: correct mobile navbar`
- `docs: update local setup guide`

## 6. 推送分支

第一次推送该分支：

```bash
git push -u origin docs/git-onboarding
```

以后同一分支可直接：

```bash
git push
```

## 7. 创建 Pull Request

在 GitHub 上将自己的分支合并目标设置为 `main`。

PR 描述至少说明：

- 做了什么
- 如何验证
- Reviewer 需要重点关注什么

合并前先查看 `Files changed`，确认实际改动符合预期。

## 8. Review 与 Merge

Reviewer 至少检查：

- 是否完成对应 Issue / 任务
- 是否混入不相关修改
- 是否能正常运行
- 命名和结构是否容易理解
- 是否包含密钥、环境文件或私密数据

检查通过后再合并到 `main`。

## 9. 合并后同步本地 main

```bash
git switch main
git pull
```

## 10. 安全规则

本项目使用环境变量保存服务配置。

- `.env.local`：不得提交
- `.env.example`：可以提交，但不能包含真实密钥
- MiniMax API Key、Supabase 私密凭据和其他 token：不得提交

提交前建议始终执行：

```bash
git status
```

确认没有敏感文件被纳入提交。
