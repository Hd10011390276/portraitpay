const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  // Light mode screenshot
  const lightPage = await context.newPage();
  await lightPage.goto('http://localhost:3005/enterprise/certification', { waitUntil: 'domcontentloaded' });
  await lightPage.waitForTimeout(2000);
  await lightPage.screenshot({ path: 'I:/Portraitpay ai/网站进度/Screenshot/20260527/cert_final_light.png', fullPage: true });
  console.log('Light mode screenshot saved');

  // Dark mode screenshot
  const darkPage = await context.newPage();
  await darkPage.goto('http://localhost:3005/enterprise/certification', { waitUntil: 'domcontentloaded' });
  await darkPage.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await darkPage.reload({ waitUntil: 'domcontentloaded' });
  await darkPage.waitForTimeout(2000);
  await darkPage.screenshot({ path: 'I:/Portraitpay ai/网站进度/Screenshot/20260527/cert_final_dark.png', fullPage: true });
  console.log('Dark mode screenshot saved');

  await browser.close();
  console.log('Done!');
}

takeScreenshots().catch(console.error);