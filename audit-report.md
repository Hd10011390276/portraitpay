# PortraitPay AI — Comprehensive Audit Report

**Date:** 2026-04-29
**Auditor:** Subagent (Code Review + Security Audit + Office Document Audit + Visual Audit)
**Project Path:** `C:\Users\Administrator\.openclaw\workspace\PortraitPay`

---

## 1. Development Progress Summary

| Category | Status | Count |
|----------|--------|-------|
| **Functional Pages** | Fully implemented | ~20 |
| **Placeholder / Incomplete** | Needs work | ~8 |
| **Stub / Skeleton** | Bare or no-op | ~4 |
| **Missing** | Not created | ~3 |

**Overall functional completeness: ~70%**

The project has a sophisticated full-stack architecture with Next.js 14+, NextAuth v5, Prisma ORM, PostgreSQL (Neon), S3/R2 storage, Stripe payments, AI face recognition, blockchain integration, and a multi-role user system. The foundation is solid — but several payment and AI integration features are stub-only or incomplete.

---

## 2. Pages & Routes Inventory

### Public Pages
| Route | File | Status |
|-------|------|--------|
| `/` (Home) | `src/app/page.tsx` | ✅ Functional (31KB — full landing page with features, FAQ, pricing) |
| `/login` | `src/app/(auth)/login/page.tsx` | ✅ Functional |
| `/register` | `src/app/(auth)/register/page.tsx` | ✅ Functional |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | ✅ Functional |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | ✅ Functional |
| `/contracts` | `src/app/contracts/page.tsx` | ✅ Functional (download center) |
| `/contracts/payment` | `src/app/contracts/payment/page.tsx` | ⚠️ Partial (PayPal/Stripe links are placeholders) |
| `/contracts/unlock` | `src/app/contracts/unlock/page.tsx` | ❌ Missing page.tsx (route dir exists) |
| `/terms` | `src/app/terms/page.tsx` | ⚠️ Not confirmed |
| `/privacy` | `src/app/privacy/page.tsx` | ⚠️ Not confirmed |
| `/contact` | `src/app/contact/page.tsx` | ⚠️ Not confirmed |
| `/faq` | `src/app/faq/page.tsx` | ⚠️ Not confirmed |
| `/celebrity` | `src/app/celebrity/page.tsx` | ⚠️ Not confirmed |
| `/enterprise` | `src/app/enterprise/page.tsx` | ⚠️ Not confirmed |
| `/enterprise/authorization/apply` | — | ⚠️ Not confirmed |
| `/enterprise/lawyer-registration` | — | ⚠️ Not confirmed |

### Authenticated Dashboard
| Route | File | Status |
|-------|------|--------|
| `/dashboard` | `src/app/dashboard/page.tsx` | ✅ Functional (22KB — stats, recent portraits, transactions) |

### Admin Pages
| Route | Status |
|-------|--------|
| `/admin/contacts` | ✅ |
| `/admin/earnings` | ✅ |
| `/admin/enterprise` | ✅ |
| `/admin/infringements` | ✅ |
| `/admin/lawyers` | ✅ |
| `/admin/api-keys` | ✅ |
| `/admin/audit` | ✅ |
| `/admin/dashboard` | ✅ |

### API Routes (Key Ones)
| Route | Status |
|-------|--------|
| `/api/auth/login` | ✅ Functional |
| `/api/auth/register` | ✅ Functional (10KB — email + wallet auth, bcrypt, audit logging) |
| `/api/auth/forgot-password` | ✅ |
| `/api/auth/otp/send` | ✅ |
| `/api/auth/otp/verify` | ✅ |
| `/api/portraits` | ✅ Functional |
| `/api/portraits/[id]/upload` | ✅ Functional (presigned S3 URL) |
| `/api/face/compare` | ✅ Functional (server-side face-api + canvas) |
| `/api/face/embed` | ✅ Functional |
| `/api/face/register` | ⚠️ STUB (returns stub FaceId, no real embedding storage) |
| `/api/face/route.ts` | ⚠️ STUB GET/POST (no-op) |
| `/api/contracts/[name]` | ✅ Functional (auth-gated docx download) |
| `/api/contracts/unlock` | ⚠️ STUB (no real PayPal/Stripe verification) |
| `/api/v1/payments/initiate` | ✅ (Stripe integration) |
| `/api/v1/withdrawals` | ✅ |
| `/api/v1/earnings/summary` | ✅ |
| `/api/v1/earnings/transactions` | ✅ |
| `/api/v1/ai/midjourney` | ✅ Functional (6.6KB) |
| `/api/v1/ai/runway` | ✅ Functional (6.7KB) |
| `/api/v1/kyc` | ✅ |
| `/api/v1/enterprise/*` | ✅ |
| `/api/v1/webhooks/stripe` | ✅ |
| `/api/admin/*` | ✅ (full admin API) |

---

## 3. Security Issues Found

| Severity | Issue | Location |
|----------|-------|----------|
| 🟠 **HIGH** | **No rate limiting on public auth endpoints** (`/api/auth/login`, `/api/auth/register`, `/api/auth/otp/*`). Brute-force password attacks are possible with no throttling. | `src/app/api/auth/` |
| 🟠 **HIGH** | **Contract unlock has no real payment verification** — `/api/contracts/unlock` accepts any txId string and unlocks the docx. Attackers can bypass payment. | `src/app/api/contracts/unlock/route.ts` |
| 🟠 **HIGH** | **`ignoreBuildErrors: true`** in `next.config.mjs` — Type errors are silently suppressed, hiding potential type-safety issues in production. | `next.config.mjs` |
| 🟡 **MEDIUM** | **`eslint: { ignoreDuringBuilds: true }`** — Linting errors are also ignored during build. | `next.config.mjs` |
| 🟡 **MEDIUM** | **No explicit CORS configuration** — No `cors` middleware on API routes. If the app scales to cross-origin usage, this needs explicit management. | All API routes |
| 🟡 **MEDIUM** | **`/api/face/register` is a complete stub** — it returns a random UUID as FaceId with no actual face embedding storage. Any code relying on this for identity verification is insecure. | `src/app/api/face/register/route.ts` |
| 🟡 **MEDIUM** | **`/api/face` GET returns "stub" mode** — the face API status check misleadingly reports as "available" when it's just a stub. | `src/app/api/face/route.ts` |
| 🟡 **MEDIUM** | **No CSRF protection on state-changing API routes** — No CSRF tokens implemented. However, Next.js App Router cookies are SameSite by default, providing some protection. | Non-critical |
| 🟢 **INFO** | **Credentials are only in `.env.example` / `.env.production.example`** — no real secrets in source. This is correct. | Env files |
| 🟢 **INFO** | **Auth uses JWT with edge-compatible `verifyToken`** in middleware — good architecture. | `src/middleware.ts` |
| 🟢 **INFO** | **bcryptjs for password hashing** — correctly used for credential auth. | `src/app/api/auth/register/route.ts` |

### Security Audit Tool Result
```
Checks performed: 12
🔴 Critical: 0
🟠 High: 1 (rate limiting / payment stub)
Total findings: 12
⚠️ High-risk issues found — Review recommended before deployment.
```

---

## 4. Performance Issues Found

| Severity | Issue | Location |
|----------|-------|----------|
| 🟡 **MEDIUM** | **`ignoreBuildErrors: true`** — hides type errors that could cause runtime issues. | `next.config.mjs` |
| 🟢 **INFO** | **Dynamically imported S3 client** (`await import("@aws-sdk/client-s3")`) inside functions — good for tree-shaking. | `src/lib/storage/index.ts` |
| 🟢 **INFO** | **Dynamically imported nodemailer** inside `sendSmtpEmail` — only loaded when needed. | `src/app/api/auth/register/route.ts` |
| 🟢 **INFO** | **No N+1 queries detected** — Prisma `select` used to limit fields, `findMany` with pagination. | `src/app/api/portraits/route.ts` |
| 🟢 **INFO** | **`force-dynamic` on all API routes** — prevents caching of dynamic data, correct for authenticated APIs. | Multiple API routes |
| 🟢 **INFO** | **Batch `Promise.all` for parallel data fetching** in portrait listing. | `src/app/api/portraits/route.ts` |

---

## 5. Contract Files Audit

### DOCX Files (in `public/contracts/`)
| Filename | Size | Valid? | Content Preview |
|----------|------|--------|-----------------|
| `00-Overview-and-Signing-Guide.docx` | 63.9 KB | ✅ Yes | "PortraitPay AI — PORTRAITPAY AI CONTRACT GUIDE — Overview and Signing Instructions" (24 paragraphs) |
| `01-Standard-License-Agreement.docx` | 59.7 KB | ✅ Yes | "PortraitPay AI — STANDARD LICENSE AGREEMENT — Non-Exclusive Portrait Licensing Contract" (40 paragraphs) |
| `02-Exclusive-License-Agreement.docx` | 58.0 KB | ✅ Yes | "PortraitPay AI — EXCLUSIVE LICENSE AGREEMENT — Exclusive Portrait Licensing Contract" (42 paragraphs) |
| `03-Endorsement-License-Agreement.docx` | 58.0 KB | ✅ Yes | "PortraitPay AI — ENDORSEMENT LICENSE AGREEMENT — Brand Ambassador Portrait Licensing Contract" (40 paragraphs) |
| `04-Film-Adaptation-License-Agreement.docx` | 58.3 KB | ✅ Yes | "PortraitPay AI — FILM ADAPTATION LICENSE AGREEMENT — Content Adaptation Portrait Licensing Contract" (41 paragraphs) |

### PDF Files
| Filename | Location | Status |
|----------|----------|--------|
| `00-Overview-and-Signing-Guide.pdf` | ❌ **MISSING** from `public/contracts/pdf/` |
| `01-Standard-License-Agreement.pdf` | ❌ **MISSING** from `public/contracts/pdf/` |
| `02-Exclusive-License-Agreement.pdf` | ❌ **MISSING** from `public/contracts/pdf/` |
| `03-Endorsement-License-Agreement.pdf` | ❌ **MISSING** from `public/contracts/pdf/` |
| `04-Film-Adaptation-License-Agreement.pdf` | ❌ **MISSING** from `public/contracts/pdf/` |

**Note:** The `public/contracts/pdf/` directory does not exist. The `/contracts` page attempts to fetch `GET /contracts/pdf/{name}.pdf` — all PDF downloads will 404.

**Other PDFs found in project root** (not contract-related):
- `PortraitPayAi_Business_Proposal.pptx .pdf` — 248 KB (business proposal)
- `商业计划_v2.pdf` — 510 KB (Chinese business plan)

---

## 6. Visual Audit (Screenshots)

**Unable to capture screenshots** — `http://localhost:3000` is not reachable (dev server not running on host machine, or firewall/network issue). Puppeteer was not installed in the project; Playwright is present (`@playwright/test@1.59.1`).

### Screenshot Plan (Not Yet Executed)
The following screenshots were intended but could not be taken:
| Page | URL | Reason |
|------|-----|--------|
| Homepage | `http://localhost:3000` | Server unreachable |
| Dashboard | `http://localhost:3000/dashboard` | Server unreachable |
| Contracts | `http://localhost:3000/contracts` | Server unreachable |
| Login | `http://localhost:3000/login` | Server unreachable |

**To capture screenshots:** Run the dev server (`npm run dev`) first, then install Puppeteer or use Playwright (`npx playwright screenshot`).

---

## 7. Critical Gaps & Missing Features

| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| 1 | **PDF contract files missing** | 🔴 CRITICAL | All 5 PDF files for free download don't exist. `public/contracts/pdf/` directory is missing entirely. `/contracts` page will 404 on every PDF download attempt. |
| 2 | **Payment unlock is stub** | 🔴 CRITICAL | `/api/contracts/unlock` accepts any transaction ID and unlocks the Word file — no real PayPal/Stripe verification. Users can bypass payment. |
| 3 | **No rate limiting** | 🔴 CRITICAL | All auth endpoints (login, register, OTP) have no rate limiting. Brute-force attacks are trivially possible. |
| 4 | **`/contracts/unlock` page missing** | 🔴 CRITICAL | Route directory exists (`src/app/contracts/unlock/`) but `page.tsx` is missing. Navigation to unlock page will 404. |
| 5 | **`/api/face/register` is a stub** | 🟠 HIGH | Returns fake FaceId with no embedding storage. Any identity verification relying on this is unreliable. |
| 6 | **`ignoreBuildErrors: true`** | 🟠 HIGH | Silently swallows TypeScript errors in production builds. |
| 7 | **PDF contract generation scripts not run** | 🟠 HIGH | Python scripts exist (`mk_all_contracts.py`, `mk_contract_v5.py`, `make_en_docx_v3.py`) — but PDFs were never generated and placed in `public/contracts/pdf/`. |
| 8 | **`/api/face` status is misleading** | 🟡 MEDIUM | GET `/api/face` returns `status: "available", provider: "stub"` — misleading consumers of this API. |
| 9 | **Contracts unlock page uses localStorage** | 🟡 MEDIUM | Unlock state stored in localStorage — not server-verified. Could be bypassed by manipulating localStorage. |
| 10 | **No CORS configuration** | 🟡 MEDIUM | No explicit CORS headers on API routes. Future cross-origin usage may be problematic. |
| 11 | **`/contracts/payment` has placeholder URLs** | 🟡 MEDIUM | `PAYPAL_LINK = "https://www.paypal.me/PortraitPayAI/1"` and `STRIPE_LINK = "https://buy.stripe.com/test"` — not real production links. |
| 12 | **No HTTP security headers** | 🟡 MEDIUM | No CSP, X-Content-Type-Options, HSTS headers configured (can be added in `next.config.mjs`). |
| 13 | **`typescript: ignoreBuildErrors` + `eslint: ignoreDuringBuilds`** | 🟡 MEDIUM | Technical debt — errors are hidden, not fixed. |
| 14 | **Payment page relies on manual txId entry** | 🟡 MEDIUM | User must manually enter PayPal/Stripe transaction ID — no webhook auto-verification. |

---

## 8. Recommendations (Prioritized)

### 🔴 P0 — Must Fix Before Launch

1. **[CRITICAL] Generate all 5 PDF contract files** — Run `python make_en_docx_v3.py` or use `mk_all_contracts.py` to generate PDFs. Place in `public/contracts/pdf/`. Without this, every free PDF download fails.

2. **[CRITICAL] Fix `/api/contracts/unlock` payment verification** — Integrate real PayPal/Stripe verification. Store verified payments in Supabase to prevent replay attacks. Current implementation is a security hole.

3. **[CRITICAL] Add rate limiting to auth endpoints** — Implement rate limiting on `/api/auth/login`, `/api/auth/register`, `/api/auth/otp/send`. Use a library like `rate-limiter-flexible` or Upstash Redis.

4. **[CRITICAL] Create missing `src/app/contracts/unlock/page.tsx`** — The route directory exists but the page component is missing. This page is referenced in the payment flow.

### 🟠 P1 — High Priority

5. **[HIGH] Fix `ignoreBuildErrors: true`** — Remove from `next.config.mjs`. Fix all TypeScript errors properly before production deployment.

6. **[HIGH] Implement real `/api/face/register`** — Replace stub with actual face embedding extraction using `@vladmandic/face-api` or Aliyun Face API, store in database with proper user association.

7. **[HIGH] Replace placeholder payment URLs** — Replace `PAYPAL_LINK` and `STRIPE_LINK` with real PayPal.me and Stripe payment links in `/contracts/payment/page.tsx`.

8. **[HIGH] Add HTTP security headers** — Add CSP, X-Content-Type-Options, Strict-Transport-Security to `next.config.mjs`.

### 🟡 P2 — Medium Priority

9. **[MEDIUM] Add explicit CORS configuration** — Use `cors` package or Next.js middleware to explicitly configure allowed origins for API routes.

10. **[MEDIUM] Fix `/api/face` status response** — Return realistic status/providermetadata, not "stub" when actual implementation differs.

11. **[MEDIUM] Add CSRF protection** — Implement CSRF tokens for state-changing operations (though SameSite cookies provide baseline protection).

12. **[MEDIUM] Add `.env` file check in build** — Ensure `.env.local` is required and warn if missing in development.

### 🟢 P3 — Nice to Have

13. **[LOW] Start local dev server for visual QA** — Run `npm run dev` and capture screenshots for visual regression testing.

14. **[LOW] Add healthcheck endpoint** — `/api/health` returning 200 for load balancer health checks.

15. **[LOW] Add full-text search to Prisma schema** — For portrait search functionality.

---

## Appendix: Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Auth | NextAuth v5 (JWT, Google OAuth, Wallet-based) |
| Database | PostgreSQL via Prisma ORM (Neon serverless) |
| File Storage | AWS S3 / Cloudflare R2 via `@aws-sdk/client-s3` |
| Payments | Stripe + PayPal (integration points exist) |
| AI / Face | `@vladmandic/face-api` (server-side), stub endpoints |
| Blockchain | Ethereum wallet-based auth (WalletProvider in NextAuth) |
| Styling | Tailwind CSS + CSS custom properties (dark mode) |
| Email | Nodemailer (SMTP) |
| Face Models | TensorFlow.js-based models in `public/models/` |
| i18n | Custom `LanguageContext` + `translations.ts` (zh-CN + en) |
| Monitoring | Prisma-powered audit logging |

---

*End of Audit Report*