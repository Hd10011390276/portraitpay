# PortraitPay QA & Bug Fixing Skill

## CRITICAL: Browser Verification Required

**A task is NOT complete until a real browser has been opened and inspected.**

Do not say "verified" unless:
- Playwright or similar automation was run against the actual local URL, AND
- The page rendered visibly with no crash/blank/error, AND
- Console had no errors.

Build passing, TypeScript passing, and curl returning 200 are all NOT sufficient alone.

For every fix, you MUST report:
1. http://localhost:3000/ - page loads, no crash, no console errors
2. The changed page URL - same checks
3. Any new navigation links added

If browser automation fails: report "Browser verification not completed" and the reason clearly.

## When to Use This Skill

Use when:
- User reports a page is "broken", "fails", "doesn't work", "returns an error"
- New features fail on production but work locally
- Deployment breaks after a new commit
- Database schema and code are out of sync
- API requests fail with missing field errors

## 🔑 Golden Rules

### 1. API Contracts Are Sacred
**Always read the API route handler before diagnosing the frontend.**
- The route handler (`route.ts`) defines the actual required fields
- Frontend may be sending different fields than what the API expects
- Check: what does the API actually validate vs what the form sends?

### 2. Environment Variables Are Real
Many "code bugs" are actually missing env vars on production:
- Always check if an env var is set on Vercel before blaming code
- Key env vars: `ETH_WALLET_PRIVATE_KEY`, `PINATA_JWT`, `AWS_*`, `DATABASE_URL`

### 3. Database Migrations Must Run
New Prisma models = `npx prisma migrate dev` must be run:
- New model added → migration needed before production works
- Check: `npx prisma migrate status` locally

### 4. Build Errors = Hidden Runtime Errors
A build success locally doesn't mean production works:
- Build may skip error recovery that crashes at runtime
- Watch for: JSX parse errors, malformed ternary expressions

---

## 🐛 Common Bug Patterns & Fixes

### Pattern A: "XXX and YYY are required" (API validation error)
**Root cause:** Frontend sends different fields than what the API route expects.

**Debug steps:**
1. Read the API route handler at `src/app/api/<path>/route.ts`
2. Find the validation/schema section (usually Zod schema)
3. Compare with what the frontend `fetch()` call sends in `body: {}`
4. Frontend is missing a field → add it to the fetch body
5. API requires unnecessary field → consider removing or making optional

**Example:** KYC submit API requires `idCardNumberHash` + `portraitHash` + `faceMatchScore`, but frontend only sends `idCardFrontUrl` (a file URL string). Fix: frontend must compute SHA-256 hashes and call face-api.js for matching.

### Pattern B: "Cannot read property X of undefined" or "X is not a function"
**Root cause:** Usually one of:
1. `await` missing on async function
2. Object doesn't have expected shape (check API response)
3. Runtime import failure (module not loaded)

**Debug steps:**
1. Check browser console for the exact line number
2. Check Vercel server logs: `vercel logs portraitpay 2>&1 | Select-Object -Last 50`
3. Add defensive null checks
4. For Next.js dynamic imports, ensure `"use client"` is present

### Pattern C: Build succeeds but page is blank or crashes
**Root cause:** JSX parse error (malformed syntax). Next.js/SWC error recovery can mask the real issue.

**Debug steps:**
1. Run `npm run build` locally and watch for error location
2. Check for malformed ternary: `{cond ? A : B : C}` is invalid (parsed as `(A ? B : C)`)
3. Check for missing exports between files
4. Check for case-sensitivity issues in imports

### Pattern D: Page loads but button/form doesn't work
**Root cause:** Either:
1. API route doesn't exist (check if route.ts file exists)
2. Wrong HTTP method (GET vs POST handler)
3. Missing auth session

**Debug steps:**
1. Check if route file exists at correct path
2. Check if correct HTTP method is exported (GET, POST, etc.)
3. Check if route has `getSessionFromRequest()` auth check
4. Test API directly: `curl -X POST https://portraitpayai.com/api/... -H "Content-Type: application/json" -d "{}"`

### Pattern E: Blockchain/IPFS/Storage operation fails
**Root cause:** Missing or stub environment variables.

**Debug steps:**
1. Check `.env.production.example` for required vars
2. Check Vercel dashboard → Settings → Environment Variables
3. Look for `STUB` or `false` flags — if set to "true", operations are mocked

### Pattern F: Page returns 404 in production but works locally
**Root cause:** Route conflict, missing `page.tsx`, or middleware redirect.

**Debug steps:**
1. Check for duplicate route folders (e.g., `/enterprise/page.tsx` vs `/enterprise/[id]/page.tsx`)
2. Check `middleware.ts` for redirects
3. Check if folder path is correct (note: Windows path parsing issues with PowerShell)

---

## 🔍 QA Checklist (Per Page)

Before marking a page as "fixed", verify:

### Auth-gated pages (requires login)
- [ ] Page loads without crash
- [ ] Auth redirect works (if not logged in → redirect to /login)
- [ ] API calls include credentials
- [ ] All buttons/links work
- [ ] Form submissions show success/error states

### Public pages
- [ ] Page loads without crash
- [ ] All links navigate correctly
- [ ] No console errors

### API routes
- [ ] Returns correct status code (200/400/401/404/500)
- [ ] Returns `{ success: true/false, data/error: ... }` shape
- [ ] Auth check works (401 for unauthorized)
- [ ] Validation errors return 400 with specific message

### Blockchain features
- [ ] `ETH_WALLET_PRIVATE_KEY` is set on Vercel
- [ ] Balance is sufficient for gas
- [ ] RPC URL is accessible
- [ ] Contract address is correct

### Storage features (S3/R2)
- [ ] `AWS_*` env vars are set
- [ ] Bucket exists and is accessible
- [ ] Presigned URL generated successfully

---

## 📁 Key File Locations

| Purpose | Path |
|---------|------|
| KYC submit API | `src/app/api/v1/kyc/submit/route.ts` |
| Portrait create API | `src/app/api/portraits/route.ts` |
| Portrait certify API | `src/app/api/portraits/[id]/certify/route.ts` |
| Blockchain lib | `src/lib/blockchain/index.ts` |
| Storage lib | `src/lib/storage/index.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Auth session | `src/lib/auth/session.ts` |
| KYC page | `src/app/kyc/page.tsx` |
| Upload page | `src/app/portraits/upload/page.tsx` |

---

## 🗄️ Database Migration Checklist

When adding a new Prisma model:

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_<model_name>` locally
3. Verify migration applies: `npx prisma migrate status`
4. Commit migration files
5. Push to GitHub → Vercel auto-deploys
6. If model still missing on production → run migration manually or redeploy

---

## 🌐 Environment Variables Reference

| Variable | Purpose | If Missing |
|----------|---------|------------|
| `ETH_WALLET_PRIVATE_KEY` | Blockchain signing | Blockchain cert fails |
| `PINATA_JWT` | IPFS uploads | IPFS upload fails |
| `AWS_*` | S3/R2 storage | Image upload fails |
| `DATABASE_URL` | Neon PostgreSQL | All DB operations fail |
| `AUTH_SECRET` | Session encryption | Auth fails |
| `KYC_ALIYUN_*` | Cloud KYC | KYC uses stub mode |

---

## Browser Verification Is Mandatory

Before any task is considered complete, run Playwright or browser automation against:
- http://localhost:3000/ (homepage must remain stable)
- The page changed by the task
- Any new navigation link added by the task

Verification checklist per page:
- [ ] Page loads visibly (not blank)
- [ ] No crash or error in the browser
- [ ] No console errors
- [ ] Layout matches existing visual patterns
- [ ] Homepage has not changed unexpectedly

If the dev server is not running: start it with `npm run dev` first.

## Required Verification Report

Every final response must include:

```
Verification:
- Build/typecheck: PASS/FAIL
- Browser tested:
  - http://localhost:3000/: [status] [result]
  - [changed page URL]: [status] [result]
- Console errors: none / [list errors]
- Homepage unchanged: YES/NO
- Forbidden UI files touched: YES/NO
```

## Git Safety

- Do not use `git reset --hard`
- Do not git push unless the user explicitly asks
- If rollback is needed: revert only the specific file causing the issue

---

## 📋 Bug Report Template

When reporting a bug, include:
1. Page/Route where it occurs
2. Exact error message (from UI or console)
3. Steps to reproduce
4. Probable root cause
5. File:line reference

## 🚀 Deployment Verification

After any fix:
1. Run `npm run build` locally → must succeed
2. Push to GitHub → wait for Vercel deploy
3. Test the specific flow that was broken
4. Report result to user
