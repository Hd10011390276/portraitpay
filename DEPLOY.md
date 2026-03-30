# PortraitPay AI — 部署指南

> 完整部署配置 + 多平台部署手册 | 2026-03-30

---

## 📋 环境变量清单

所有生产环境必须配置的环境变量，**请在部署平台中设置为 Secret/Environment Variables**，切勿硬编码。

### 🔐 核心变量（必需）

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | NextAuth 加密密钥 | `openssl rand -base64 32` 生成 |
| `AUTH_URL` | 站点根 URL（生产环境必须设置） | `https://portraitpayai.com` |
| `NEXTAUTH_URL` | 同 `AUTH_URL` | `https://portraitpayai.com` |
| `NEXTAUTH_SECRET` | 同 `AUTH_SECRET` | `openssl rand -base64 32` 生成 |

### 🔑 OAuth（可选）

| 变量名 | 说明 |
|--------|------|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |

### 💰 Stripe 支付

| 变量名 | 说明 |
|--------|------|
| `STRIPE_SECRET_KEY` | `sk_live_...` 或 `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` 或 `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`（Stripe Dashboard 生成） |
| `STRIPE_STUB` | `true`=桩模式，`false`=真实支付 |

### ⛓️ 区块链（Ethereum Sepolia）

| 变量名 | 说明 |
|--------|------|
| `ETHEREUM_SEPOLIA_RPC_URL` | Infura/Alchemy Sepolia RPC URL |
| `ETH_WALLET_PRIVATE_KEY` | 部署合约的钱包私钥（ burner wallet） |
| `PORTRAIT_CERT_CONTRACT_ADDRESS` | 已部署的版权合约地址 |

### 🖼️ IPFS（Pinata）

| 变量名 | 说明 |
|--------|------|
| `PINATA_API_KEY` | Pinata API Key |
| `PINATA_SECRET_API_KEY` | Pinata Secret |
| `PINATA_JWT` | Pinata JWT Token |

### ☁️ 对象存储（S3 / Cloudflare R2）

| 变量名 | 说明 |
|--------|------|
| `AWS_S3_BUCKET` | Bucket 名称 |
| `AWS_S3_REGION` | 区域，如 `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Access Key |
| `AWS_SECRET_ACCESS_KEY` | Secret Key |
| `AWS_ENDPOINT` | R2 用 `https://xxx.r2.cloudflarestorage.com` |

### 🤳 KYC 身份认证

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `KYC_PROVIDER` | `aliyun` | 当前激活的提供商: `aliyun` \| `tencent` \| `onfido` \| `jumio` |
| `KYC_ALIYUN_STUB` | `true` | 开发环境设为 `true` |
| `KYC_ALIYUN_AUTO_APPROVE` | `true` | 开发环境设为 `true` |
| `KYC_ALIYUN_ACCESS_KEY_ID` | — | 阿里云 AccessKey |
| `KYC_ALIYUN_ACCESS_KEY_SECRET` | — | 阿里云 Secret |
| `KYC_ALIYUN_REGION` | `cn-shanghai` | 阿里云区域 |
| `KYC_ALIYUN_APP_ID` | — | 实人认证方案 ID |
| `KYC_ALIYUN_WEBHOOK_SECRET` | — | Webhook 回调验签密钥 |

### 🤖 AI / OpenAI（可选）

| 变量名 | 说明 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI API Key（用于 AI 相关功能） |

---

## 🚀 方式一：Vercel 部署（推荐）

Vercel 与 Next.js 深度集成，是最简单、最快速的部署方式。

### 前置准备

1. 注册 [Vercel](https://vercel.com) 账号
2. 将代码推送到 GitHub 仓库
3. 在 Vercel 中 Import 项目

### 部署步骤

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 在项目根目录初始化
vercel

# 4. 配置生产环境变量
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add AUTH_URL
# ... 添加所有环境变量（见上表）

# 5. 生产部署
vercel --prod
```

### GitHub Actions 自动部署（推荐）

1. 在 GitHub 仓库 Settings → Secrets 添加以下 Secrets：
   - `VERCEL_TOKEN` — Vercel Personal Access Token
   - `VERCEL_ORG_ID` — Vercel Organization ID
   - `VERCEL_PROJECT_ID` — Vercel Project ID
   - `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL` 等所有环境变量

2. 推送代码到 `main` 分支，CI/CD 自动触发：
   - Lint + Type Check
   - Prisma Migrate Deploy
   - Vercel Build + Deploy

### 域名绑定（Vercel）

1. 进入 Vercel Dashboard → Project → Settings → Domains
2. 添加自定义域名（如 `portraitpayai.com`）
3. 在域名 Registrar 处添加 Vercel 提供的 DNS 记录
4. 等待 SSL 证书自动签发（HTTPS 自动）

### Vercel 环境变量配置参考

在 Vercel Dashboard → Project → Environment Variables 中配置：

```
AUTH_URL                 = https://portraitpayai.com
NEXTAUTH_URL             = https://portraitpayai.com
AUTH_SECRET              = [openssl rand -base64 32]
DATABASE_URL             = [Neon/Supabase PostgreSQL 连接串]
STRIPE_SECRET_KEY        = sk_live_...
STRIPE_PUBLISHABLE_KEY   = pk_live_...
STRIPE_WEBHOOK_SECRET    = whsec_...
ETHEREUM_SEPOLIA_RPC_URL = https://sepolia.infura.io/v3/YOUR_KEY
PINATA_JWT               = [Pinata JWT]
AWS_S3_BUCKET            = portraitpay-uploads
AWS_S3_REGION            = us-east-1
AWS_ACCESS_KEY_ID        = [Key]
AWS_SECRET_ACCESS_KEY    = [Secret]
KYC_PROVIDER             = aliyun
KYC_ALIYUN_STUB          = false
KYC_ALIYUN_AUTO_APPROVE  = false
KYC_ALIYUN_ACCESS_KEY_ID = [Key]
KYC_ALIYUN_APP_ID        = [App ID]
```

---

## 🚀 方式二：Railway 部署

Railway 支持一键部署 Node.js 应用，内置 PostgreSQL 数据库。

### 部署步骤

1. 注册 [Railway](https://railway.app)
2. 安装 Railway CLI：
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **创建 PostgreSQL 数据库**：
   ```bash
   railway add --plugin postgresql
   # Railway 会自动设置 RAILWAY_POSTGRESQL_URL
   ```

4. **设置环境变量**：
   ```bash
   railway variables set AUTH_SECRET=$(openssl rand -base64 32)
   railway variables set AUTH_URL=https://your-app.railway.app
   railway variables set NEXTAUTH_URL=https://your-app.railway.app
   # ... 添加其他变量
   ```

5. **部署**：
   ```bash
   railway up
   ```

6. **配置域名**：
   - Railway Dashboard → Project → Settings → Networking → Add Domain

### Railway + GitHub Actions

1. 在 Railway 获取 Personal Token：`Settings → Account → Personal Tokens`
2. 在 GitHub Secrets 添加：
   - `RAILWAY_TOKEN` — Railway Personal Token
   - 其他所有环境变量

3. 推送代码，CI/CD 自动执行 `railway up --service portraitpay`

---

## 🐳 方式三：Docker 自托管

适合有自己的 VPS、Docker 环境的用户。

### 前置准备

- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL 16（可用 Docker 内置）

### 快速启动

```bash
# 1. 克隆代码
git clone https://github.com/YOUR_ORG/portraitpay.git
cd portraitpay

# 2. 复制环境变量文件
cp .env.example .env
# 编辑 .env，填入真实值

# 3. 构建并启动
docker-compose up -d --build

# 4. 查看日志
docker-compose logs -f app

# 5. 运行数据库迁移
docker-compose exec app npx prisma migrate deploy
```

### 生产环境 `.env` 示例

```bash
# 数据库
DATABASE_URL=postgresql://portraitpay:YOUR_STRONG_PASSWORD@db:5432/portraitpay
DB_USER=portraitpay
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_PORT=5432

# 应用
APP_PORT=3000
APP_DOMAIN=portraitpayai.com
NODE_ENV=production

# 认证
AUTH_SECRET=YOUR_GENERATED_SECRET
AUTH_URL=https://portraitpayai.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STUB=false

# KYC
KYC_PROVIDER=aliyun
KYC_ALIYUN_STUB=false
KYC_ALIYUN_AUTO_APPROVE=false
KYC_ALIYUN_ACCESS_KEY_ID=...
KYC_ALIYUN_ACCESS_KEY_SECRET=...
KYC_ALIYUN_APP_ID=...
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name portraitpayai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portraitpayai.com;

    ssl_certificate     /etc/ssl/certs/portraitpayai.com.crt;
    ssl_certificate_key /etc/ssl/private/portraitpayai.com.key;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 使用外部 PostgreSQL（Supabase/Neon）

如果使用云数据库，修改 `docker-compose.yml` 中的 `DATABASE_URL` 指向云端：

```bash
# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Neon
DATABASE_URL=postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

然后移除 `docker-compose.yml` 中的 `db` 服务（PostgreSQL）。

---

## 🗄️ 云数据库配置

### Supabase

1. 创建项目：https://supabase.com
2. Settings → Connection String → URI
3. Connection string 格式：
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```
4. 在 SQL Editor 中启用 Prisma 扩展：
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

### Neon

1. 创建项目：https://neon.tech
2. Connection Details → Connection string
3. 注意：`sslmode=require` 必须加到连接串末尾
   ```
   postgresql://user:password@host.region.neon.tech/dbname?sslmode=require
   ```

### 启用 Prisma 连接池（推荐）

Neon 和 Supabase 都使用 PgBouncer 做连接池：

```
# Neon — 使用完整连接串（已包含 pool_mode）
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require&pgbouncer=true

# Supabase — 使用 Session 模式
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true
```

---

## 🗃️ 数据库迁移

### 首次部署

```bash
# 本地开发
npm run db:migrate

# Docker 环境
docker-compose exec app npm run db:migrate

# Vercel / Railway（通过 CI/CD 自动执行）
# 已在 GitHub Actions 和 vercel.json 中配置
```

### 本地重置开发数据库

```bash
# 推 schema 到本地数据库（不清除数据，适合开发）
npx prisma db push

# 完全重置（清除所有数据）
npx prisma migrate reset

# 查看 Prisma Studio
npm run db:studio
```

### 生产环境迁移流程

1. 确保 `DATABASE_URL` 指向生产数据库
2. 运行迁移（幂等操作，可重复执行）：
   ```bash
   npx prisma migrate deploy
   ```
3. 验证迁移状态：
   ```bash
   npx prisma migrate status
   ```

---

## 🔒 安全检查清单

- [ ] `AUTH_SECRET` 使用 `openssl rand -base64 32` 生成，不可预测
- [ ] `ETH_WALLET_PRIVATE_KEY` 是 burner wallet，无主网资金
- [ ] `DATABASE_URL` 仅允许应用服务器访问，禁止公开
- [ ] Stripe Webhook 启用并配置签名验证
- [ ] 所有第三方 API Key 存储在 Platform Secrets，不在代码中
- [ ] KYC Webhook Secret 启用，防止伪造回调
- [ ] HTTPS 强制启用（Vercel/Railway 默认，Nginx 需手动配置）
- [ ] `STRIPE_STUB=false` 生产环境确保关闭桩模式

---

## 📁 项目文件结构

```
portraitpay/
├── vercel.json               # Vercel 配置文件
├── docker-compose.yml        # Docker 自托管配置
├── Dockerfile                # Docker 镜像构建
├── next.config.mjs           # Next.js 配置（已启用 standalone）
├── package.json              # build 脚本已包含 prisma generate
│
├── .env.example              # 环境变量模板
├── prisma/
│   └── schema.prisma         # 数据库 schema
│
└── .github/
    └── workflows/
        └── deploy.yml        # CI/CD 流程
```

---

## ⚡ 部署步骤速查

### Vercel（推荐）
```bash
git push main → GitHub Actions 自动构建 → 自动部署
```

### Railway
```bash
railway login → railway up → railway add --plugin postgresql
```

### Docker 自托管
```bash
cp .env.example .env && vim .env
docker-compose up -d --build
docker-compose exec app npx prisma migrate deploy
```

### 数据库迁移（任意环境）
```bash
npx prisma migrate deploy
```
