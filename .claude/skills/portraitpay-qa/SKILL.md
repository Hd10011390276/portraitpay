---
name: portraitpay-qa
description: Optimized multi-agent QA workflow for PortraitPay. Triggers on "QA the site", "run QA", "verify all pages", "full QA audit". Covers 24 pages × light+dark modes with template-based reporting to minimize token waste.
---

# PortraitPay QA Skill

## When to Use

After any code change that affects >3 files. Always use before git push.

## Optimized Agent Architecture (10 Agent, ~350 tokens)

### Round 1: Web Grid (5 Agent × template output)

**Public pages (1 Agent × 4 pages):**
```
QA http://localhost:3005. TEMPLATE OUTPUT ONLY. 
Pages: /, /login, /register, /faq.
For each: curl→200? browser_evaluate:document.body.innerText.length>100?
Toggle dark→same check. console_errors:[list].
Report EXACTLY: "PAGE|LIGHT|OK/FAIL|ERRORS" "PAGE|DARK|OK/FAIL|ERRORS"
```

**Auth pages (4 Agent × 3-4 pages each):**
```
QA http://localhost:3005. Login 799096322@qq.com/Hd210011390276.
TEMPLATE OUTPUT ONLY.
Pages: /dashboard,/portraits,/portraits/upload,/settings
For each: wait 3s→body.innerText.length>100? toggle dark→same.
console_errors:[list].
Report EXACTLY: "PAGE|LIGHT|OK/FAIL|ERRORS" "PAGE|DARK|OK/FAIL|ERRORS"
```

### Round 2: Legal + Security + API (2 Agent × curl only)

**Legal (curl only):**
```
curl /privacy|grep -cE "CCPA|Biometric|Do Not Sell"
curl /terms|grep -cE "arbitration|JAMS|Los Angeles County"
curl /lawyers|grep -c "independent third-party"
Report: "CHECK|OK/FAIL|COUNT"
```

**Security + API (curl only):**
```
/api/portraits/anyid→401? Login rate limit 6 fails→429?
Login 799096322@qq.com/Hd210011390276→token.
/api/portraits?limit=1→200? /api/lawyers/cases→200? /api/auth/me→200?
Report: "CHECK|OK/FAIL"
```

### Round 3: Workflow + Build (3 Agent)

**Workflow (1 Agent, curl):**
```
Login→POST /api/report/submit→{success:true}?
GET /api/consent-passport→200?
GET /api/portraits?limit=1→data.length>0?
Report: "FLOW|OK/FAIL"
```

**Code (1 Agent, grep+build):**
```
npx next build. .env.local in .gitignore?
grep -rn "from.*earnings|from.*withdraw" src/app/→zero?
Report: "CHECK|OK/FAIL"
```

**Mobile (1 Agent, Playwright, template output):**
```
QA http://localhost:3005. 375x812 viewport. Login.
Pages: /dashboard,/portraits,/inbox,/report,/settings,/faq,/privacy
For each: wait 2s→no horizontal scroll? buttons≥44px?
Report: "PAGE|OK/FAIL|ISSUE"
```

---

## Template Output Rule

ALL agents MUST use this exact format. No free-form prose.

```
PAGE|MODE|OK/FAIL|CONSOLE_ERRORS
/faq|light|OK|0
/faq|dark|OK|0
/dashboard|light|OK|0
/dashboard|dark|OK|0
...
```

## Token Budget

| Round | Agents | Est. tokens | What |
|-------|--------|------------|------|
| R1 Web | 5 | ~180 | Template-based page scan |
| R2 Legal+Sec | 2 | ~15 | curl only |
| R3 Workflow+Code+Mobile | 3 | ~100 | curl + grep + Playwright |
| **Total** | **10** | **~350** | **vs 626 before (-44%)** |
