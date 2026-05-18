# PortraitPay UI Safety and Browser Verification Policy

## Mandatory Scope

Use this policy for every PortraitPay task in this repository.

This policy applies to:
- bug fixes
- marketplace features
- API work
- Prisma/schema work
- auth/payment/lawyer/actor/creator flows
- UI additions
- refactors
- deployment fixes
- QA and verification

## Core Rule

Protect the existing UI first.

The current homepage and shared layout are considered stable. Do not redesign, restyle, or casually edit them.

The product direction is a three-sided marketplace: actors, creators, and lawyers should discover each other, communicate inside the platform, and create licensing transactions or infringement/legal cases from that communication.

But marketplace work must be additive and isolated. Do not damage the existing homepage or dashboard while building it.

## Hard Forbidden Files Unless Explicitly Requested

Do not edit these files unless the user explicitly asks for changes to them:

- src/app/page.tsx
- src/app/layout.tsx
- src/app/globals.css
- tailwind.config.ts
- src/components/layout/DashboardShell.tsx
- src/components/layout/Header.tsx
- src/components/layout/Sidebar.tsx
- src/components/ThemeToggle.tsx
- shared UI primitives under src/components/ui/*
- public/logo.png
- public/logo-dark.png

If a task appears to require one of these files:
1. Stop before editing.
2. Explain why the file seems necessary.
3. Prefer an isolated alternative.
4. Only edit it if the user explicitly approves.

## Protected Homepage Requirement

Before and after every task, the homepage must remain visually stable:

- URL: http://localhost:3000/
- The page must load.
- Header, hero, CTA, sections, footer, theme toggle, and layout must remain intact.
- No accidental new homepage sections.
- No global style drift.
- No broken text, mojibake, missing translation keys, or blank sections.

If the homepage changes unexpectedly, revert only the UI change that caused it. Do not reset unrelated backend or feature work.

## UI Change Rules

When UI work is required:

- Keep changes isolated to the feature page or component.
- New marketplace pages may be added, for example:
  - src/app/actors/*
  - src/app/creators/*
  - src/app/lawyers/*
  - src/app/inbox/*
  - src/app/marketplace/*
- Follow existing visual patterns.
- Do not redesign the homepage.
- Do not change global CSS unless explicitly approved.
- Do not make large visual refactors.
- Do not introduce Chinese hardcoded JSX text in new .tsx files.
- Use English UI text unless the existing i18n system is being carefully extended.
- If editing src/lib/i18n/translations.ts, only add isolated keys needed by the new feature. Do not restructure existing translation objects.

## Marketplace Product Architecture

The desired architecture is a marketplace, not only an admin workflow.

Preferred product flow:

Discovery -> Contact -> Conversation -> Terms/Request -> Approval -> Payment -> Active Authorization -> Infringement/Lawyer Case if needed

The three sides are:

1. Actor / Talent
   - uploads portraits
   - defines licensing preferences
   - receives licensing requests
   - can contact lawyers for infringement help

2. Creator / Buyer
   - discovers actors/portraits
   - contacts actors
   - requests licenses
   - pays through platform

3. Lawyer
   - has public profile
   - can be discovered by actors/creators
   - communicates in platform
   - handles infringement cases when converted/escalated

Important: Discovery pages alone are not enough. The platform needs an inbox/conversation layer so users can interact before a transaction or case exists.

## Preferred Conversation Architecture

If implementing site messaging, do not rely on a weak standalone Message model.

Prefer:

- Conversation
  - id
  - type: GENERAL | LICENSING | INFRINGEMENT | LAWYER_CASE
  - subject
  - portraitId nullable
  - authorizationId nullable
  - infringementReportId nullable
  - lawyerCaseId nullable
  - status: OPEN | CLOSED | ARCHIVED
  - createdAt
  - updatedAt

- ConversationParticipant
  - id
  - conversationId
  - userId
  - roleInConversation: ACTOR | CREATOR | LAWYER | ADMIN
  - lastReadAt
  - createdAt
  - unique(conversationId, userId)

- Message
  - id
  - conversationId
  - senderId
  - body
  - attachments
  - read/deleted metadata
  - createdAt
  - updatedAt

Rules:
- Only participants can read or write messages.
- Contact buttons on actor/lawyer/creator profiles should create or open a conversation.
- Request License can start from a conversation or route to the existing authorization flow.
- Lawyer case escalation should preserve the conversation context when possible.

## Current Marketplace Direction

Useful future pages:
- /actors
- /creators
- /lawyers
- /inbox
- /inbox/[id]

Useful actions:
- Contact Actor
- Request License
- Contact Lawyer
- Report Infringement
- Convert to Lawyer Case
- Pay Authorization

Do not build these by rewriting the homepage. Add small links only if explicitly asked.

## Backend Safety

Backend changes are allowed when they are directly required by the task, but keep them scoped.

Do not use git reset --hard.
Do not run destructive commands.
Do not git push unless the user explicitly asks.

Before changing Prisma:
- Inspect existing models and relations.
- Prefer extending existing models cleanly over creating duplicate concepts.
- Run Prisma generate/build checks when feasible.
- If Prisma generate fails because a dev server is locking files, stop/restart the dev server or explain the blocker.

## Browser Verification Is Mandatory

A task is not complete until browser verification has actually happened.

Build success is not enough.
API curl success is not enough.
TypeScript success is not enough.

For every task, verify in a real browser using the installed browser automation skill/tool, agent-browser, or Playwright.

Required pages:
1. http://localhost:3000/
2. Every page changed by the task
3. Every new navigation link added by the task
4. Any page involved in the changed flow

Browser verification must check:
- page loads visibly
- no blank screen
- no obvious layout break
- no broken navigation
- no console errors
- homepage still looks stable
- changed page actually reflects the intended feature

If a dev server is not running:
- Start it with npm run dev.
- Reuse an existing dev server if already running.
- Use the actual local URL tested.

If browser automation tools are available:
- Use them.
- Do not skip them.
- Do not say "verified" unless the browser was actually opened or automated.

If browser automation is unavailable or fails:
- Report clearly: "Browser verification was not completed."
- Include the exact reason.
- Do not pretend verification succeeded.

## Required Verification Report

Every final response must include:

- Files changed
- Whether forbidden UI files were touched
- Build/typecheck result
- Browser URLs tested
- Browser console result
- Whether http://localhost:3000/ remained visually stable
- Remaining risks

Use this format:

Verification:
- Build/typecheck:
- Browser tested:
  - http://localhost:3000/:
  - [changed page]:
- Console errors:
- Homepage unchanged:
- Forbidden UI files touched:

## Git Safety

Before risky or broad work:
- Run git status --short.
- Identify changed files.
- Do not revert unrelated user work.
- If rollback is needed, rollback only the specific file/change causing the issue.
- Never use git reset --hard.
- Never git push without explicit user instruction.

## Task Planning Rule

Before implementation, briefly state:
1. Files expected to change
2. Files explicitly protected
3. Browser verification plan

If the task can be done without touching UI, do not touch UI.

## Final Reminder

The goal is not just to make code compile.
The goal is to preserve the working UI, verify it in a browser, and build marketplace features safely.