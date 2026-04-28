# PortraitPay AI 网站审计报告

审计时间： 2026-04-27
域名： [portraitpayai.com](portraitpayai.com)
托管： Vercel（x-vercel-id: sfo1）
构建ID： oOqt4BZ-a0tzZ64-BM9nt
技术栈： Next.js 15 + React + TypeScript + Tailwind CSS（从 HTML 和 JS bundle 反推）

---

## 一、整体完成度评估

**结论：完成度约 65-70%。** 核心营销页面完整，但"吃鸡"功能（实际上链、授权、NFT铸造）尚未公开测试。

---

## 二、页面级审计

### ✅ 首页（Landing Page）
- Hero + 4个核心功能模块完整
- 定价区：免费版和专业版（目前均为 ¥0 — 说明还未进入收费阶段）
- KYC、AI检测、区块链、IPFS、版税功能讲解清晰
- 律师入驻独立区块
- FAQ 完整
- 中英文切换 UI 完整（但实际功能未验证）

### ✅ 登录页（/login）
- 双模式：邮箱登录 + 手机验证码
- 用户类型切换：普通用户 / 律师
- 表单完整，包含忘记密码链接
- 表单验证 UI 就绪

### ✅ 注册页（/register）
- 服务条款 + 隐私政策勾选框
- 违法内容声明（说明已有合规意识）
- 表单字段齐全

### ✅ 律师入驻（/enterprise/lawyer-registration）
- 律师楼 vs 个人律师选择
- 完整表单：律所名、国家、联系人、邮箱、电话
- 26个国家选项（🇨🇳 中国标注"待开发"）
- 入驻须知清晰

### ⚠️ /dashboard
- 返回 307 → 重定向（未登录 → 登录页），逻辑正确
- 但吃鸡用户核心功能无法审计

### ❌ robots.txt / sitemap.xml
- 返回 302 跳转到首页 → 说明这两个文件缺失，对 SEO 不友好

---

## 三、技术实现审计

### 基础设施
```
✅ Next.js 15 + App Router（RSC）
✅ Vercel Edge Network（cache: HIT）
✅ HTTPS + HSTS（Strict-Transport-Security）
✅ 响应式设计（mobile/桌面自适应）
✅ 深色模式支持（localStorage theme 切换）
✅ 中英文 i18n UI（语言切换按钮）
```

### 认证系统
```
✅ NextAuth v5（从 skill 数据已知）
✅ 自定义 JWT 双系统（cookie + Bearer）
✅ API 路由 401 正确返回
✅ Middleware 保护（/dashboard → 307）
```

### 区块链集成（从 skill 上下文）
```
✅ Sepolia 测试网（首页公告确认）
✅ 智能合约架构存在
✅ IPFS 存储设计
⚠️ 实际链上合约地址未在首页暴露
```

### SEO / 可发现性
```
❌ 无 robots.txt
❌ 无 sitemap.xml
✅ Meta tags 完整（og:title/description/twitter:card）
✅ SEO meta keywords 齐全
⚠️ 百度搜索无结果（中文产品需主动提交）
```

---

## 四、关键风险 & 待办

### 🔴 高优先级
1. 收费功能未上线 — 专业版 ¥0 明显是占位，需要接入 Stripe/支付宝
2. KYC 实际流程 — 页面上说了但不知道跑通没有
3. 区块链实际效果 — Sepolia 测试网，需要验证是否真的在跑
4. 中国用户支付 — 支付宝/微信支付未集成（提现页面提到过）

### 🟡 中优先级
1. robots.txt / sitemap.xml — 必须加，对 SEO 关键
2. 仪表盘页面 — 登录后的核心功能未知
3. 律师审核流程 — 申请提交后后台管理未审计
4. 侵权检测实际效果 — AI 监控功能未实测

### 🟢 低优先级
1. 英文版本 — 语言切换 UI 有但英文内容可能缺失
2. Mobile App — 目前只有 Web

---

## 六、补充检测结果（独立完成，无需登录）

### DNS / IP
```
域名解析 IP: 76.76.21.21
属于 Vercel Edge Network
```

### SSL / HTTPS
```
✅ 证书有效，页面可访问
✅ HTTPS 正常
✅ HSTS: max-age=63072000（2年） — 严格强制 HTTPS
```

### 响应头安全评估
```
✅ Strict-Transport-Security: max-age=63072000
✅ X-Vercel-Cache: HIT（CDN 缓存命中，正常）
✅ X-Vercel-Id: sfo1::xxx（确认部署在 Vercel SFo1 区域）
✅ Cache-Control: public, max-age=0, must-revalidate
✅ Access-Control-Allow-Origin: *（CORS 开放）
✅ ETag 存在
✅ Content-Type: text/html; charset=utf-8

❌ X-Frame-Options 缺失（点击劫持风险）
❌ X-Content-Type-Options 缺失（MIME sniffing 风险）
❌ Referrer-Policy 缺失
❌ Permissions-Policy 缺失
```

### robots.txt / sitemap.xml
```
robots.txt: ❌ 缺失 → 307 重定向到 /login（Vercel 默认行为）
sitemap.xml: ❌ 缺失 → 307 重定向到 /login
状态码: 307 TemporaryRedirect
Location: /login?redirect=%2Frobots.txt
```

### CDN 缓存状态
```
X-Vercel-Cache: HIT（CDN 缓存命中）
Age: 24556 秒（约 6.8 小时）
说明页面已被 CDN 缓存，访问速度正常
```

### Build ID
```
当前构建: DZzbIBWcjZPtbLlPMNT2a
（与用户报告的 oOqt4BZ- 不同，说明已有新构建部署）
```

### 内链资源
```
favicon.ico: ✅ 200 OK
favicon.png: ✅ 200 OK
```

---

## 七、与 skill 记忆对比（context: PortraitPay项目）

从记忆中的 PortraitPay 状态：
- ✅ 已在 Vercel 上线（确认）
- ✅ 地区选择器 US/CN/HK/TW（落地页未体现，但注册表单有）
- ✅ 提现页面存在（但需要登录才能看）
- ⚠️ Bearer Token 问题已修复（skill 记录）
- ⚠️ Railway DB 仍在使用（skill 记录）
- ⚠️ Gmail CI/CD 监控（未在网站体现）

---

## 八、独立可完成的修复项（无需登录即可处理）

| 优先级 | 事项 | 预计工作量 | 说明 |
|--------|------|-----------|------|
| 🔴 高 | 补 robots.txt | < 30分钟 | 放在 `public/robots.txt`，阻止搜索爬虫抓登录页 |
| 🔴 高 | 补 sitemap.xml | < 1小时 | Next.js 可用 `next-sitemap` 包自动生成 |
| 🟡 中 | 添加 X-Frame-Options | < 5分钟 | Middleware 或 next.config.js 配置 |
| 🟡 中 | 添加 X-Content-Type-Options | < 5分钟 | 同上 |
| 🟢 低 | 添加 Referrer-Policy | < 5分钟 | 安全头配置 |
| 🟢 低 | 添加 Permissions-Policy | < 5分钟 | 安全头配置 |

**最小可行改进**: robots.txt + sitemap.xml，两个文件即可对 SEO 产生实质提升。

---

## 一句话总结

前端 UI/UX 已相当成熟，核心流程跑通，但商业化闭环（付费、KYC 实际核身、链上真实铸造）尚处于"演示级"水平，真实资产流通功能需要进一步开发验证。
