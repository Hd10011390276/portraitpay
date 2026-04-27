# PortraitPay 开发工作流 & 踩坑记录
> 最后更新：2026-04-27

---

## 一、项目基础设施

### 环境
- **代码目录**：`C:\Users\Administrator\.openclaw\workspace\portraitpay`
- **Node 版本**：v24.13.0
- **包管理**：npm（package-lock.json）
- **部署**：Vercel（项目名 `portraitpay`，Project ID `prj_6FYHbjqW3UebcAxGAwuIk0wXcVpr`）
- **数据库**：Railway PostgreSQL（Vercel 内置 env `DATABASE_URL`）
- **域名**：portraitpayai.com（已配置）

### Git 配置
- **GitHub**：https://github.com/Hd10011390276/portraitpay
- **提交邮箱**：`audit@portraitpay.ai`（不是 `hangdivision@gmail.com`，后者会导致 Vercel build 失败）
- **本地机器名**：`杭帝`（中文，有空格，导致 Vercel CLI 的 HTTP header 校验失败）

---

## 二、日常开发流程

### 1. 写代码 → 本地验证
```bash
cd C:\Users\Administrator\.openclaw\workspace\portraitpay
# 写代码...
npm run build   # 本地构建验证
```

### 2. 推 GitHub → Vercel 自动构建
```bash
git add -A
git status      # 检查有没有漏文件
git commit -m "fix: 具体描述"
git push
# Vercel 自动触发构建，不需要手动操作
```

### 3. 验证 Production
- 等 Vercel build 完成（约 2-5 分钟）
- 访问 portraitpayai.com 验证

---

## 三、已踩过的坑（按严重程度排序）

### 🚨 P0 — 致命错误（会导致线上故障）

#### 1. 环境变量名称不匹配
**现象**：区块链交易或 IPFS 上传在 Vercel 上静默失败
**原因**：代码中使用的 env var 名称和 Vercel Dashboard 设置的不一致

| 代码里用的 | 实际应该填 |
|-----------|-----------|
| `process.env.ETHEREUM_SEPOLIA_RPC_URL` | `ETHEREUM_SEPOLIA_RPC_URL` |
| `process.env.PORTRAIT_CERT_CONTRACT_ADDRESS` | `PORTRAIT_CERT_CONTRACT_ADDRESS` |
| `process.env.ETH_WALLET_PRIVATE_KEY` | `ETH_WALLET_PRIVATE_KEY` |
| `process.env.PINATA_JWT` | `PINATA_JWT` |

**教训**：每次新增 env var 后，对照代码里的 `process.env.XXX` 核查 Vercel 是否已填。

#### 2. Token 复制时多打空格
**现象**：Vercel 环境变量保存成功但运行时值为 `" 0x..."`（前面有空格），导致签名失败
**原因**：复制粘贴 JWT 或私钥时头尾有多余空格

**规则**：
- 复制 token 时用鼠标精准选中（不用 Ctrl+A 全选）
- 粘贴后立刻检查开头和结尾
- 存盘前用 vscode 显示所有不可见字符确认

#### 3. Vercel CLI 机器名包含中文
**现象**：`vercel login` 报错 "杭帝 @ vercel is not a legal HTTP header value"
**影响**：无法通过 CLI 操作 Vercel（env:add、deploy 等）
**现状**：无法解决，**必须通过 Vercel Dashboard 网页操作**
**变通方案**：所有 Vercel 操作改用网页版（Settings → Environment Variables / Deployments）

---

### ⚠️ P1 — 需要注意（会导致构建失败或功能异常）

#### 4. Git 提交邮箱错误
**现象**：Vercel build 失败，日志显示 commit author email 不合法
**原因**：本地 git config 全局设置了 `hangdivision@gmail.com`，而 Vercel 信任的是 `audit@portraitpay.ai`
**解决**：每个项目单独设置：
```bash
git config user.email "audit@portraitpay.ai"
git config user.name "PortraitPay AI"
```

#### 5. JSX 内 Tailwind 使用 `pb-[max(...)]` 导致 parser 混淆
**现象**：`Unexpected token div. Expected jsx identifier`，Build 失败
**出错代码**：
```tsx
<main className="... pb-[max(2rem,env(safe-area-inset-bottom,1rem))]">
```
**原因**：Next.js/SWC 对 Tailwind arbitrary value 里的 `max()` 语法解析异常
**解决**：改用内联 `style` 对象：
```tsx
<main className="..." style={{ paddingBottom: `max(2rem, ${safeAreaBottom})` }}>
```

#### 6. 缺少 barrel file (`@/lib/auth/index.ts`)
**现象**：`Module not found: Can't resolve '@/lib/auth'` 或导出找不到
**原因**：某些路由 import 时用了 `@/lib/auth` 而不是 `@/lib/auth/session`
**解决**：创建 `src/lib/auth/index.ts` 作为 barrel file，统一 re-export

#### 7. canvas npm 包在 Vercel 上未安装
**现象**：`Module not found: Can't resolve 'canvas'`，但只是警告不阻断
**原因**：`@vladmandic/face-api` 的本地模式需要 `canvas`，Vercel Edge Runtime 没有
**处理**：代码里已有 try/catch fallback 到阿里云/腾讯云，不影响功能
**备注**：如果未来要用本地 face-api.js 模式，需要在 Vercel 上装 `canvas`（不易，需 root 权限）

---

### 💡 P2 — 经验记录

#### 8. `.env.production` 不参与 Vercel 构建
**原因**：Vercel 构建时环境变量来自 Dashboard 设置，不读本地 `.env.production`
**教训**：`.env.production` 只做本地参考；所有 env var 必须去 Vercel Dashboard 填

#### 9. Vercel 免费版每日 100 次部署限制
**现象**：下午频繁 push 后收到限制警告
**应对**：
- commit 前先在本地 `npm run build` 确认通过再 push
- 批量改完后一次性 push，不要频繁单文件 commit

#### 10. Windows 路径分隔器
**现象**：PowerShell 中 `cmd /c` 执行路径命令时反斜杠和 `&&` 冲突
**经验**：
- 直接用 `node -e "..."` 执行简单脚本最稳
- 用 `cmd /c "cd /d 目录 && 命令"` 处理复杂命令
- 避免在 PowerShell 中混用 `/` 和 `\` 路径

#### 11. 文件名包含括号导致路径解析异常
**现象**：`app/(auth)/login/page.tsx` 路径在部分工具里识别错误
**处理**：在需要枚举文件时用 `cmd /c "dir /s /b"` 代替 `Get-ChildItem -Recurse`

#### 12. `middleware.ts` 中间件路径匹配陷阱
**原因**：Next.js 15 中 middleware 的 `matcher` 正则写得不对会绕过所有路由
**经验**：matcher 写简单点，用 `/\api\/` 不要用复杂的负向前瞻

---

## 四、环境变量配置清单（2026-04-27 最新）

> 全部在 Vercel Dashboard → Settings → Environment Variables 填写

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `PINATA_JWT` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | IPFS 上传认证 |
| `ETHEREUM_SEPOLIA_RPC_URL` | `https://ethereum-sepolia.publicnode.com` | Sepolia 区块链节点 |
| `PORTRAIT_CERT_CONTRACT_ADDRESS` | `0xC2da77c9e9027c0902eA00dB185217542fF48F7E` | 区块链合约地址 |
| `ETH_WALLET_PRIVATE_KEY` | `0xdd16c5857220Fe731ac6c5885abf746e563464fea0fd063b3a4ab503e05fc910` | 平台签名钱包 |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0xC2da77c9e9027c0902eA00dB185217542fF48F7E` | 前端显示用 |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | `https://ethereum-sepolia.publicnode.com` | 前端显示用 |

---

## 五、关键文件路径（快速索引）

### 区块链相关
- `src/lib/blockchain/index.ts` — `certifyPortrait()` 主函数
- `src/lib/blockchain/abi.ts` — ABI 和 `SUPPORTED_NETWORKS` 配置
- `src/app/api/portraits/[id]/certify/route.ts` — 认证 API 入口

### IPFS 相关
- `src/lib/ipfs/index.ts` — `uploadJsonToIpfs()` / `uploadToIpfs()`

### 移动端 UI
- `src/components/layout/DashboardShell.tsx` — 移动端 safe-area 处理
- `src/components/ui/Toast.tsx` — toast 底部安全区
- `src/app/layout.tsx` — `viewportFit: "cover"` 配置

### Auth
- `src/lib/auth/index.ts` — barrel file（解决模块解析问题）
- `src/lib/auth/session.ts` — `getSessionFromRequest()`
- `src/lib/auth/jwt.ts` — `signTokenPair()` / `verifyToken()`

### 智能合约
- `contracts/PortraitCert.sol` — 部署在 Sepolia 的合约源码

---

## 六、部署后必查清单

每次 push 后 Vercel 自动构建，构建完成后检查：

- [ ] Build 是否成功（无红色 error）
- [ ] 环境变量是否生效（点进 Deployment 查看环境变量）
- [ ] 手机端 UI 是否正常（顶部刘海、底部 home bar 不遮挡）
- [ ] 区块链认证测试（上传肖像 → 点认证 → 等待 → 看是否成功上链）
- [ ] IPFS 上传测试（认证后 Etherscan 查交易是否成立）

---

## 七、常见问题处理

| 问题 | 解决方法 |
|------|---------|
| Vercel build 失败 | 本地先跑 `npm run build`，确认通过再 push |
| 区块链认证失败 | 检查 Vercel 环境变量（私钥/RPC/合约地址）|
| IPFS 上传失败 | 检查 `PINATA_JWT` 是否正确，是否过期 |
| `canvas` 报错 | 不影响，云服务有 fallback |
| Vercel CLI 无法登录 | 改用 Dashboard 网页操作 |
| Git push 后 Vercel 没反应 | 去 Deployments 页面手动点 Redeploy |

---

## 八、团队协作注意事项

1. **代码 review**：每次 push 前本地 build 一次
2. **环境变量变更**：必须通知全员更新本地 `.env.production` 参考
3. **私钥管理**：私钥只存在于 Vercel 环境变量，不进代码仓库
4. **commit message 规范**：前缀用 `fix:` / `feat:` / `chore:` 便于追溯
---

## 九、重要里程碑版本

### v1.0.0 ✅ 区块链认证上线（2026-04-27）
- **Commit**: 24d6d9（fix: export getSessionFromRequest and add canvas package）
- **Production URL**: https://portraitpay.vercel.app
- **首个成功上链 TX**: https://sepolia.etherscan.io/tx/0xf23b08e877735d5c9b6e940df8fde18e5895c3813aa902064a5ef8ff3ce22f1f
- **IPFS CID**: QmTzv656SHiJUottZwo8ceEGxVoxrTvSgNErmoULu2CEof
- **PortraitCert 合约**: Sepolia 0xC2da77c9e9027c0902eA00dB185217542fF48F7E
- 包含功能：肖像上传 + 人脸比对 + 区块链认证 + IPFS 存储
- **回滚时**：如新版本部署后出现认证失败，检查此 commit 是否被覆盖
