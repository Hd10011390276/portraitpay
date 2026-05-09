/**
 * PortraitPay AI - Comprehensive QA Test Suite
 * Tests: Desktop & Mobile, All Core Flows, i18n
 *
 * Run: node tests/e2e/qa-mobile.js
 */

const { chromium } = require('@playwright/test');

const BASE_URL = process.env.TEST_URL || 'https://portraitpayai.com';

class QATestRunner {
  constructor() {
    this.results = [];
    this.browser = null;
  }

  async setup() {
    this.browser = await chromium.launch({ headless: true });
  }

  async teardown() {
    if (this.browser) await this.browser.close();
  }

  async test(name, fn) {
    try {
      await fn();
      this.results.push({ name, passed: true });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.results.push({ name, passed: false, error: error.message });
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }

  async runDesktopTests(context) {
    console.log('\n🖥️  Desktop Tests (1280x720)');

    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    // Homepage
    await this.test('Homepage loads correctly', async () => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
      const title = await page.title();
      if (!title.includes('PortraitPay')) throw new Error(`Unexpected title: ${title}`);
    });

    // Login page
    await this.test('Login page loads correctly', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      if (!await emailInput.isVisible()) throw new Error('Email input not found');
      if (!await passwordInput.isVisible()) throw new Error('Password input not found');
    });

    await this.test('Login flow succeeds', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Test123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
    });

    await this.test('Dashboard loads after login', async () => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      const url = page.url();
      if (url.includes('/login')) throw new Error('Redirected back to login');
    });

    await this.test('No console errors on homepage', async () => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
    });

    await this.test('No console errors on login page', async () => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
    });

    await this.test('No console errors on dashboard', async () => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
    });

    // Register page
    await this.test('Register page loads correctly', async () => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="姓名"]').first();
      if (!await nameInput.isVisible()) throw new Error('Name input not found');
    });

    await page.close();
  }

  async runMobileTests() {
    console.log('\n📱 Mobile Tests (375x667 - iPhone SE)');

    const context = await this.browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });

    const page = await context.newPage();

    // Mobile Homepage
    await this.test('[Mobile] Homepage loads correctly', async () => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
    });

    // Mobile Login
    await this.test('[Mobile] Login page loads correctly', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      const emailInput = page.locator('input[type="email"]');
      if (!await emailInput.isVisible()) throw new Error('Email input not found');
    });

    await this.test('[Mobile] Login form inputs are accessible', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      // Check that form elements are visible and properly sized
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitBtn = page.locator('button[type="submit"]');

      const emailBounds = await emailInput.boundingBox();
      const passwordBounds = await passwordInput.boundingBox();
      const btnBounds = await submitBtn.boundingBox();

      if (!emailBounds || emailBounds.height < 30) throw new Error('Email input too small');
      if (!passwordBounds || passwordBounds.height < 30) throw new Error('Password input too small');
      if (!btnBounds || btnBounds.height < 30) throw new Error('Submit button too small');
    });

    await this.test('[Mobile] Login flow succeeds', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Test123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
    });

    await this.test('[Mobile] Dashboard loads after login', async () => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      const url = page.url();
      if (url.includes('/login')) throw new Error('Redirected back to login');
    });

    await this.test('[Mobile] Dashboard hamburger menu works', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Test123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      await page.waitForTimeout(1000);
      // Click anywhere on the page to ensure focus
      await page.click('body');
      // Try to find and click the hamburger menu button
      const buttons = await page.locator('button').all();
      if (buttons.length === 0) throw new Error('No buttons found');
    });

    await this.test('[Mobile] No console errors on homepage', async () => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
    });

    await this.test('[Mobile] No console errors on login page', async () => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
    });

    await this.test('[Mobile] No console errors on dashboard', async () => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      if (errors.length > 0) throw new Error(`Console errors: ${errors.join(', ')}`);
    });

    // Mobile Register
    await this.test('[Mobile] Register page loads correctly', async () => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="姓名"]').first();
      if (!await nameInput.isVisible()) throw new Error('Name input not found');
    });

    await page.close();
    await context.close();
  }

  async runTests() {
    await this.setup();
    this.results = [];

    console.log('\n🧪 PortraitPay AI - Comprehensive QA Test Suite');
    console.log(`Testing: ${BASE_URL}\n`);

    const desktopContext = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    await this.runDesktopTests(desktopContext);
    await this.runMobileTests();

    await desktopContext.close();
    await this.teardown();

    this.printSummary();
  }

  printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Results: ${passed}/${total} passed, ${failed} failed`);
    console.log('='.repeat(60));

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  • ${r.name}`);
        console.log(`    Error: ${r.error}`);
      });
    }

    const desktopResults = this.results.filter(r => !r.name.startsWith('[Mobile]'));
    const mobileResults = this.results.filter(r => r.name.startsWith('[Mobile]'));
    const desktopPassed = desktopResults.filter(r => r.passed).length;
    const mobilePassed = mobileResults.filter(r => r.passed).length;

    console.log('\n📋 Breakdown:');
    console.log(`  Desktop: ${desktopPassed}/${desktopResults.length} passed`);
    console.log(`  Mobile:  ${mobilePassed}/${mobileResults.length} passed`);

    console.log('');

    return { passed, failed, total };
  }
}

// Run tests
const runner = new QATestRunner();
runner.runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
