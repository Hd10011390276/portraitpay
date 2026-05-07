# 区块链上链完整踩坑记录 - PortraitPay AI

## ✅ 最终配置（2026-05-07 14:15）

### 成功上链的配置
| 配置项 | 值 |
|-------|-----|
| RPC | `https://eth-sepolia.g.alchemy.com/v2/LPgAxAsrnhcqQfgn1FqBH` |
| 网络 | Ethereum Sepolia (chainId: 11155111) |
| 钱包地址 | `0xABE2DeA4E422E83076d9025622e5B45Ad7e163dF` |
| 钱包私钥 | 在 `.env.production.local` 的 `ETH_WALLET_PRIVATE_KEY` |
| 钱包余额 | ~0.0597 ETH |
| 合约地址 | `0xC2da77c9e9027c0902eA00dB185217542fF48F7E` |
| Vercel env | `ETHEREUM_SEPOLIA_RPC_URL` + `NEXT_PUBLIC_SEPOLIA_RPC_URL` |
| 部署 commit | `947e119` |

---

## 🔴 踩过的坑

### 1. Tenderly RPC 超时
- **现象**: API 调用 `/mint` 或 `/certify` 超时 60s+ 不返回
- **根因**: Vercel 出向请求到 Tenderly public RPC 被阻/限制
- **解决**: 换成 Alchemy 或 publicnode

### 2. Infura API Key 失效
- **现象**: 返回 `401 JWT invalid`
- **根因**: API key 已过期/被禁用
- **解决**: 不用 Infura，改为 Alchemy

### 3. PublicNode 验证
- **现象**: 本地测试 `ethers.js` 调用成功，但 Vercel 上超时
- **根因**: Vercel 网络到某些 RPC 被限流
- **解决**: Alchemy 免费层最稳定

### 4. API 报 "Missing ID info"
- **现象**: 上链时报 `Missing ID info: idCardType, idCardName, idCardNumber are required`
- **根因**: 
  1. idCardNumber 在数据库中为 NULL（上传时没存）
  2. API 代码只读 request body，没用数据库 stored 值做备选
- **解决**: 
  1. 手动补数据: `UPDATE portrait SET idCardNumber='...'`
  2. 代码修复: `body.idCardType ?? portrait.idCardType`

### 5. 重复定义变量
- **现象**: 编译报错 `idCardNumber is defined multiple times`
- **根因**: mint route 中声明了两次
- **解决**: 删除重复行

### 6. "Already certified" 错误
- **现象**: 上链成功但 API 返回 500 错误
- **根因**: 同一 portrait 再次上链时合约已存在，gas estimation 失败
- **说明**: 实际区块链交易已成功，只是 API 没处理好

---

## 📋 当前已知问题（未完成）

### 1. PNG 证书无法下载
- **应该**: 上链成功后生成 PNG 证书，用户可下载
- **实际**: 证书生成/下载失败
- **待排查**: `buildPortraitCertificate()` 函数

### 2. 没收到邮件
- **应该**: 上链成功后发送证书邮件到用户邮箱
- **实际**: 没有收到邮件
- **待排查**: `sendPortraitCertifiedEmail()` 函数 + SMTP 配置

---

## 📁 关键文件

- `src/app/api/portraits/[id]/certify/route.ts` - 认证 API
- `src/app/api/portraits/[id]/mint/route.ts` - 认证 API（同 certify）
- `src/lib/email/` - 邮件发送逻辑
- `src/lib/export/portrait-certificate.ts` - 证书生成逻辑
- `src/lib/blockchain/` - 区块链交互

---

## 🔧 修复待办

- [ ] 排查 PNG 证书生成 (`buildPortraitCertificate`)
- [ ] 排查邮件发送 (`sendPortraitCertifiedEmail`)
- [ ] 测试完整流程：上链 → 证书 → 邮件