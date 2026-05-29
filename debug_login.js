const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe', 
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const failed = [];
  
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('response', resp => { if (resp.status() >= 400) failed.push(resp.status() + ': ' + resp.url()); });
  page.on('pageerror', err => errors.push('PAGE: ' + err.message));
  
  try {
    await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    console.log('=== Failed Resources ===');
    failed.forEach(f => console.log(f));
    
    console.log('\n=== Console Errors ===');
    errors.forEach(e => console.log(e));
    
    console.log('\n=== Page Info ===');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body:', bodyText.substring(0, 300));
    
    await page.screenshot({ path: 'I:/Portraitpay ai/网站进度/Screenshot/login_debug.png', fullPage: true });
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();