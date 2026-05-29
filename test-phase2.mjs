import { chromium } from 'playwright';

const BROWSER = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbXBpanVmb2gwMDA0MTFrdXZ4d2ZkdTYxIiwiZW1haWwiOiJoYW5nZGk1MzM5QGdtYWlsLmNvbSIsInJvbGUiOiJMQVdZRVIiLCJpYXQiOjE3Nzk3MTk3MDMsImV4cCI6MTc3OTcyNjkwM30.y47CafukE9T_Vy-pRC2MH60Emce2jXhgDGSnvcV0R6c';

async function main() {
  const browser = await chromium.launch({ executablePath: BROWSER, args: ['--no-sandbox'], headless: true });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'pp_access_token', value: TOKEN, domain: 'localhost', path: '/' }]);
  const page = await context.newPage();
  const results = [];

  try {
    // 1. Dashboard - API Keys link
    console.log('1. Dashboard - API Keys link...');
    await page.goto('http://localhost:3000/lawyer/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const linkCount = await page.2724eval('a[href="/lawyer/api-keys"]', els => els.length);
    console.log('   Links to /lawyer/api-keys:', linkCount);
    results.push({ check: 'Dashboard API Keys link', passed: linkCount > 0 });

    // 2. API Keys page loads
    console.log('2. API Keys page...');
    await page.goto('http://localhost:3000/lawyer/api-keys', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    console.log('   Title "API Keys":', body.includes('API Keys'));
    console.log('   "Generate New Key":', body.includes('Generate New Key'));
    results.push({ check: 'API Keys page loads', passed: body.includes('API Keys') && body.includes('Generate New Key') });

    // 3. Generate API key
    console.log('3. Generate API key...');
    const inputField = await page.;
    if (inputField) {
      await inputField.fill('');
      await inputField.fill('PlaywrightTestKey');
      await page.click('button:has-text("Generate New Key")');
      await page.waitForTimeout(2000);
      const afterGen = await page.textContent('body');
      const hasNewKey = afterGen.includes('Save this key now');
      console.log('   Key generated:', hasNewKey);
      results.push({ check: 'API key generation', passed: hasNewKey });

      // 4. Extract and test API key
      if (hasNewKey) {
        const apiKey = await page.('code', el => el.textContent.trim());
        console.log('4. Test X-API-Key auth...');
        const testResp = await page.evaluate(async (key) => {
          const r = await fetch('/api/lawyers/cases', { headers: { 'X-API-Key': key } });
          return { ok: r.ok, status: r.status };
        }, apiKey);
        console.log('   API call with key:', testResp.ok ? '200 OK' : testResp.status);
        results.push({ check: 'X-API-Key authentication', passed: testResp.ok });

        // 5. Revoke key
        console.log('5. Revoke key...');
        page.once('dialog', d => d.accept());
        await page.click('button:has-text("Revoke")');
        await page.waitForTimeout(1500);
        const afterRevoke = await page.textContent('body');
        console.log('   Revoked shown:', afterRevoke.includes('Revoked'));
        results.push({ check: 'Key revocation UI', passed: afterRevoke.includes('Revoked') });

        // 6. Test revoked key fails
        console.log('6. Test revoked key blocked...');
        const revokedResp = await page.evaluate(async (key) => {
          const r = await fetch('/api/lawyers/cases', { headers: { 'X-API-Key': key } });
          return { ok: r.ok, status: r.status };
        }, apiKey);
        console.log('   Revoked key:', revokedResp.ok ? 'ALLOWED (BAD)' : );
        results.push({ check: 'Revoked key blocked', passed: !revokedResp.ok });
      }
    }

    // 7. Case detail - Export Data button
    console.log('7. Case detail Export Data...');
    await page.goto('http://localhost:3000/lawyer/cases', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const caseLinks = await page.2724eval('a[href*="/lawyer/cases/"]', els =>
      els.map(e => e.getAttribute('href')).filter(h => h && /\/lawyer\/cases\/[a-zA-Z0-9]+\/?$/.test(h) && !h.includes('new'))
    );
    if (caseLinks.length > 0) {
      await page.goto('http://localhost:3000' + caseLinks[0], { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const detailBody = await page.textContent('body');
      console.log('   "Export Data":', detailBody.includes('Export Data'));
      results.push({ check: 'Export Data button', passed: detailBody.includes('Export Data') });
    } else {
      console.log('   No cases - skipping');
      results.push({ check: 'Export Data button', passed: 'SKIP (no cases)' });
    }

    console.log('\n=== PHASE 2 VERIFICATION RESULTS ===');
    for (const r of results) console.log('  ' + (r.passed === true ? 'PASS' : r.passed === false ? 'FAIL' : 'SKIP') + ' | ' + r.check);
  } catch (err) {
    console.error('FATAL ERROR:', err.message);
  } finally {
    await browser.close();
  }
}

main();
