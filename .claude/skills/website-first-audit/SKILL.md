---
name: website-first-audit
description: Use this skill for PortraitPay website audits, UI regression checks, marketplace flow checks, admin checks, auth checks, or bug investigations. Always run Playwright browser verification before code-side debugging. Curl or build output is not enough.
---

# PortraitPay Website-First Audit

## Non-negotiable Rule

For PortraitPay website audits, UI regression checks, bug investigations, marketplace flow checks, admin checks, auth checks, or "page looks broken" tasks:

1. Run Playwright browser verification first.
2. Record actual browser findings: page status, visible UI, console errors, network failures, redirects, screenshots.
3. Only after browser findings are known, inspect code to identify the cause.
4. After fixes, run Playwright again to confirm the user-visible behavior is fixed.

Curl, fetch, `npm run build`, and `tsc` are useful, but they do not replace browser verification.

## Protected UI Rule

Do not redesign or overwrite these areas unless the user explicitly asks:

- Homepage `/`
- Global layout
- Sidebar / dashboard shell
- Header / navigation
- `globals.css`
- Tailwind theme
- Brand visuals
- Existing responsive layout

Allowed changes:
- Small bug fixes
- Auth / routing fixes
- Broken text / mojibake cleanup in touched files
- Marketplace/admin logic fixes
- Minimal UI needed for a working flow

Before editing protected UI files, stop and explain why the edit is required.

## Browser Verification Checklist

Before reading code deeply, start the dev server if needed and verify at least:

- `/`
- `/login`
- `/actors`
- `/lawyers`
- `/inbox`
- `/admin`
- `/dashboard`

For logged-out routes, confirm redirects are intentional.

For marketplace/admin tasks, also verify relevant API routes and UI flows through the browser where possible.

Required browser evidence:
- Screenshot for each important page or flow
- Console errors
- Network failures
- Unexpected redirects
- Obvious visual regressions
- Whether the page is usable on desktop
- Mobile check for at least the most affected page

Save screenshots/logs under `test-results/` or another clearly named local folder.

## Code Audit After Browser Verification

After browser verification, inspect code in this order:

1. Route/page component
2. API route
3. Auth/session guard
4. Prisma schema/model relation
5. Service/helper logic
6. Middleware redirects
7. UI state handling
8. Build/type errors

Use existing project patterns. Do not invent a new architecture unless the existing one cannot support the requirement.

## Required Verification Before Final Report

Run:

- `npx.cmd tsc --noEmit --pretty false`
- `npm.cmd run build`
- `npx.cmd prisma generate`

If a command cannot run because of missing env or DB access, report exactly why.

Then run Playwright browser verification again.

## Final Report Format

Always report as an independent auditor:

1. Browser findings first
2. Code findings second
3. What was fixed
4. What remains risky
5. What was not touched
6. Exact verification commands and results
7. Screenshots/log locations

Do not claim "browser verified" if only curl was used.