/**
 * Test certificate download using Playwright
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testCertificateDownload() {
  console.log('Starting certificate download test...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('Browser:', msg.text()));

  try {
    // Navigate to the app
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for hydration

    console.log('Current URL:', page.url());

    // Fill in login form
    console.log('Filling login form...');
    await page.fill('input[type="email"]', 'test_new@test.com');
    await page.fill('input[type="password"]', 'Demo123456');

    console.log('Clicking submit...');
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('After login URL:', page.url());
    await page.waitForTimeout(2000);

    // Navigate to portraits page
    console.log('Navigating to portraits...');
    await page.goto('http://localhost:3000/portraits', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('Portraits URL:', page.url());

    // Get portrait links
    const portraitLinks = await page.$$('a[href^="/portraits/"]');
    console.log(`Found ${portraitLinks.length} portrait links`);

    if (portraitLinks.length > 0) {
      const href = await portraitLinks[0].getAttribute('href');
      console.log('First portrait href:', href);

      // Navigate to portrait detail
      await page.goto('http://localhost:3000' + href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('Portrait detail URL:', page.url());

      // Look for download button - try multiple selectors
      const btnSelectors = [
        'button:has-text("Download Certificate")',
        'button:has-text("下载证书")',
        'button:has-text("Certificate")',
        'button:has-text("证书")',
        'button >> text=/download/i',
        'button >> text=/证书/i'
      ];

      let downloadBtn = null;
      for (const sel of btnSelectors) {
        const btn = await page.$(sel);
        if (btn) {
          const text = await btn.textContent();
          console.log(`Found button with selector "${sel}":`, text);
          downloadBtn = btn;
          break;
        }
      }

      if (downloadBtn) {
        console.log('Clicking download button...');

        // Set up download listener before clicking
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 15000 }),
          downloadBtn.click()
        ]);

        // Save the download
        const downloadPath = path.join(__dirname, 'test-certificate.png');
        await download.saveAs(downloadPath);
        console.log('Certificate saved to:', downloadPath);

        // Check file size
        const stats = fs.statSync(downloadPath);
        console.log('File size:', stats.size, 'bytes');

        if (stats.size > 1000) {
          console.log('✅ Certificate downloaded successfully!');
        } else {
          console.log('❌ Certificate file too small, might be an error');
        }
      } else {
        console.log('❌ No download button found');
        // Take a screenshot
        await page.screenshot({ path: 'test-page.png', fullPage: true });
        console.log('Screenshot saved to test-page.png');

        // Check page content
        const content = await page.content();
        console.log('Page has "certificate":', content.includes('certificate'));
        console.log('Page has "下载":', content.includes('下载'));
      }
    } else {
      console.log('No portraits found to test');
      await page.screenshot({ path: 'test-page.png', fullPage: true });
    }

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('Error screenshot saved to test-error.png');
  } finally {
    await browser.close();
  }
}

testCertificateDownload();
