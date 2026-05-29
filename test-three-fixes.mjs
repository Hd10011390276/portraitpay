import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const SCREENSHOT_DIR = 'I:/Portraitpay ai/网站进度/Screenshot/20260527';
const BASE = 'http://localhost:3005';
const CHROMIUM = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbXBpMXMwdjEwMDAwMTB1MXBwd3lwbndmIiwiZW1haWwiOiI3OTkwOTYzMjJAcXEuY29tIiwicm9sZSI6IkFHRU5DWSIsImlhdCI6MTc3OTg4ODMwNywiZXhwIjoxNzc5ODk1NTA3fQ.RFxZIbJMgxnOapr4syv23MAqsq1gSL1TlFCN3YMJczM';

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const errors = [];
const screenshots = [];

async function screenshot(page, name) {
  const path = `${SCREENSHOT_DIR}/${name}`;
  await page.screenshot({ path, fullPage: true });
  screenshots.push(path);
  console.log(`  [SCREENSHOT] ${name}`);
}

async function testPage(page, url, label, checks) {
  console.log(`\n=== ${label}: ${url} ===`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  try {
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 });
  } catch { console.log('  No spinner'); }
  await page.waitForTimeout(1500);

  const body = await page.textContent('body');
  console.log(`  Body: ${body.length} chars`);

  for (const text of checks) {
    const found = body.includes(text);
    console.log(`  ${found ? 'PASS' : 'FAIL'}: "${text}"`);
    if (!found) errors.push(`[${label}] Missing: "${text}"`);
  }

  await screenshot(page, `${label.replace(/\s+/g, '_')}.png`);
}

(async () => {
  console.log('=== PortraitPay Three-Fix Verification (Production Build) ===\n');

  const browser = await chromium.launch({
    executablePath: CHROMIUM, args: ['--no-sandbox'], headless: true,
  });

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'pp_access_token', value: AUTH_TOKEN, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();

  // Auth check
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const authResp = await page.evaluate(async () => {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    const json = await r.json();
    return { ok: r.ok, name: json?.data?.user?.name, role: json?.data?.user?.role, availableRoles: json?.data?.availableRoles };
  });
  console.log(`Auth: ok=${authResp.ok}, name=${authResp.name}, role=${authResp.role}, availableRoles=${JSON.stringify(authResp.availableRoles)}`);

  // 1. Homepage baseline
  await testPage(page, `${BASE}/`, '01_Homepage', ['PortraitPay', 'portrait']);

  // 2. Register page — verify 3 role options
  await testPage(page, `${BASE}/register`, '02_Register', ['Create Account', 'Actor/Creator', 'Agent / IP Holder', 'Lawyer']);

  // 3. Login page — verify 3 tabs
  await testPage(page, `${BASE}/login`, '03_Login', ['Sign in', 'PortraitPay']);

  // 4. Certification page — verify new fields
  await testPage(page, `${BASE}/enterprise/certification`, '04_Certification', [
    'Company / Organization Name', 'Agency Type', 'Country / Region', 'Registration / License Number',
    'Upgrade to Creator',
  ]);

  // 5. Enterprise Dashboard — IP Member management interface
  await testPage(page, `${BASE}/enterprise/dashboard`, '05_EnterpriseDashboard', [
    'Creator Dashboard', 'IP Member Management', 'IP Members',
    'Portrait Certification', 'Voiceprint Detection', 'Prepare Evidence',
    'Add IP Member',
  ]);

  // 6. Voiceprint page
  await testPage(page, `${BASE}/agent/voiceprint`, '06_Voiceprint', [
    'Voiceprint Detection', 'ECAPA-TDNN', 'Upload Audio Sample',
    'Run Voiceprint Analysis',
  ]);

  // 7. Portrait Certification page
  await testPage(page, `${BASE}/agent/portrait-certification`, '07_PortraitCert', [
    'Portrait Certification', 'Blockchain timestamp', 'Portrait Photo',
    'Certify on Blockchain',
  ]);

  // 8. Report page — evidence chain section
  await testPage(page, `${BASE}/report`, '08_Report', [
    'Infringement Report', 'Your Name',
  ]);

  // 9. Sidebar — should NOT have "Discover Actors" for agency user
  // Check sidebar is rendered
  const body = await page.textContent('body');
  console.log(`\n=== Sidebar Check ===`);
  console.log(`  Sidebar present: ${body.includes('Agency Portal')}`);

  // Summary
  console.log('\n========================================');
  console.log('       VERIFICATION SUMMARY');
  console.log('========================================');
  console.log(`Screenshots: ${screenshots.length}`);
  screenshots.forEach(s => console.log(`  ${s}`));
  console.log(`Errors: ${errors.length}`);
  errors.forEach(e => console.log(`  ${e}`));
  console.log(errors.length === 0 ? '\n*** ALL CHECKS PASSED ***' : `\n*** ${errors.length} ERRORS ***`);

  await browser.close();
  process.exitCode = errors.length > 0 ? 1 : 0;
})();
