# PortraitPay AI — Project Memory

**必须在新 session 开始时读取以下文件：**

1. `C:\Users\Administrator\.claude\projects\C--Users-Administrator\memory\portraitpay-critical-context.md` — 包含所有凭证和部署规则
2. `C:\Users\Administrator\.claude\rules\portraitpay-deployment-rules.md` — 部署红线，禁止重复犯错

**每次新 session 必须做：**

```bash
# 验证 git identity（任何 commit 操作前必做）
git config user.email  # 必须是 hangdivision@gmail.com
```

**永远禁止：**

- 使用 `agent@portraitpay.ai` 作为任何 commit 的 author
- 在 deploy.yml 里用 `vercel pull` 间接获取 DATABASE_URL
- 向用户索要已在 MEMORY.md 中保存的凭证

**Vercel / GitHub token 已在 git remote 配置中，新 session 不需要重新提供。**