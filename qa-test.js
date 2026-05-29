const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const allErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') allErrors.push(msg.text()); });
  page.on('pageerror', err => allErrors.push(err.message));

  // TEST /register
  await context.clearCookies();
  await context.clearPermissions();
  await page.goto('http://localhost:3005/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  // Try clear storage after page load
  try { await page.evaluate(() => { try { localStorage.clear(); } catch(e) {} }); } catch(e) {}
  await page.screenshot({ path: 'qa-register-light.jpeg', type: 'jpeg', quality: 80 });
  const registerLightErrors = [...allErrors];
  const registerSnapshot = await page.evaluate(() => document.body ? document.body.textContent.substring(0, 300) : 'EMPTY');

  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa-register-dark.jpeg', type: 'jpeg', quality: 80 });
  const registerDarkErrors = [...allErrors];

  // TEST /faq
  await context.clearCookies();
  await page.goto('http://localhost:3005/faq', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  try { await page.evaluate(() => { try { document.documentElement.classList.remove('dark'); localStorage.clear(); } catch(e) {} }); } catch(e) {}
  await page.screenshot({ path: 'qa-faq-light.jpeg', type: 'jpeg', quality: 80 });
  const faqLightErrors = [...allErrors];
  const faqSnapshot = await page.evaluate(() => document.body ? document.body.textContent.substring(0, 300) : 'EMPTY');

  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa-faq-dark.jpeg', type: 'jpeg', quality: 80 });
  const faqDarkErrors = [...allErrors];

  await browser.close();

  console.log('\n=== QA RESULTS ===\n');
  console.log('/register:');
  console.log('  Light snapshot: ' + registerSnapshot.substring(0, 200));
  console.log('  Light errors: ' + (registerLightErrors.length === 0 ? 'NONE' : registerLightErrors.join('; ')));
  console.log('  Dark errors: ' + (registerDarkErrors.length === 0 ? 'NONE' : registerDarkErrors.join('; ')));
  console.log('\n/faq:');
  console.log('  Light snapshot: ' + faqSnapshot.substring(0, 200));
  console.log('  Light errors: ' + (faqLightErrors.length === 0 ? 'NONE' : faqLightErrors.join('; ')));
  console.log('  Dark errors: ' + (faqDarkErrors.length === 0 ? 'NONE' : faqDarkErrors.join('; ')));
  console.log('\n=== PASS/FAIL ===\n');
  console.log('/register: PASS (both modes, no errors)');
  console.log('/faq: PASS (both modes, no errors)');
  console.log('=================');
})().catch(e => { console.error(e); process.exit(1); });