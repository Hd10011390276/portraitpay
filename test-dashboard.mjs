import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const SCREENSHOT_DIR = 'I:/Portraitpay ai/网站进度/Screenshot/20260527';
const BASE = 'http://localhost:3005';
const CHROMIUM = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbXBpMXMwdjEwMDAwMTB1MXBwd3lwbndmIiwiZW1haWwiOiI3OTkwOTYzMjJAcXEuY29tIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzc5ODgwOTk0LCJleHAiOjE3Nzk4ODgxOTR9.-_8PbPu8TFc9sQPTr_sXdipWQvkcKCb3D2Z3crllnaM';

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const errors = [];
const screenshots = [];

async function screenshot(page, name) {
  const path = `${SCREENSHOT_DIR}/${name}`;
  await page.screenshot({ path, fullPage: true });
  screenshots.push(path);
  console.log(`  [SCREENSHOT] ${name}`);
}

async function testPage(page, url, label, checks, isDashboard = false) {
  console.log(`\n=== ${label}: ${url} ===`);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

  // For dashboard pages, wait for DashboardShell spinner to disappear
  if (isDashboard) {
    try {
      await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 });
      console.log('  DashboardShell loaded');
    } catch { console.log('  No spinner (or already loaded)'); }
    await page.waitForTimeout(2000);
  }

  // Wait for expected content
  try {
    await page.waitForFunction(
      (texts) => texts.some(t => (document.body.textContent || '').includes(t)),
      checks.slice(0, 3),
      { timeout: 10000 }
    );
  } catch { console.log('  WARN: content wait timed out'); }

  await page.waitForTimeout(1000);
  const body = await page.textContent('body');
  console.log(`  Body: ${body.length} chars`);

  for (const text of checks) {
    const found = body.includes(text);
    console.log(`  ${found ? 'PASS' : 'FAIL'}: "${text}"`);
    if (!found) errors.push(`[${label}] Missing: "${text}"`);
  }

  const realErrors = consoleErrors.filter(e =>
    !e.includes('Failed to fetch') && !e.includes('net::ERR_') && !e.includes('favicon') && !e.includes('404 (Not Found)')
  );
  if (realErrors.length > 0) console.log(`  Console errors: ${realErrors.length}`);

  await screenshot(page, `${label.replace(/\s+/g, '_')}.png`);
}

(async () => {
  console.log('=== PortraitPay Dashboard Verification (Production Build) ===\n');

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
    return { ok: r.ok, name: json?.data?.user?.name, role: json?.data?.user?.role };
  });
  console.log(`Auth: ok=${authResp.ok}, name=${authResp.name}, role=${authResp.role}`);

  // 1. Homepage baseline
  await testPage(page, `${BASE}/`, '01_Homepage', ['PortraitPay', 'portrait']);

  // 2. Certification
  await testPage(page, `${BASE}/enterprise/certification`, '02_Certification', [
    'Upgrade to Creator', 'Country', 'Contact Name', 'Contact Email',
  ]);

  // 3. Enterprise Dashboard (authenticated, has AgencyAccount)
  await testPage(page, `${BASE}/enterprise/dashboard`, '03_EnterpriseDashboard', [
    'Creator Dashboard', 'DI HANG', '799096322@qq.com', 'United States',
    'Entertainment Agency', 'IP Members', 'Files', 'API Keys', 'Webhooks',
  ], true);

  // 4. Agent Dashboard
  await testPage(page, `${BASE}/agent/dashboard`, '04_AgentDashboard', [
    'Agent Dashboard', 'IP Members', 'Files', 'Webhooks', 'API Keys',
  ], true);

  // 5. No /lawyer/api-keys link
  const agentBody = await page.textContent('body');
  if (agentBody.includes('/lawyer/api-keys')) {
    errors.push('[agent] /lawyer/api-keys link still present');
    console.log('\n  FAIL: /lawyer/api-keys found');
  } else {
    console.log('\n  PASS: no /lawyer/api-keys');
  }

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
