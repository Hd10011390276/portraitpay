/**
 * Test email sending flow
 * 验证邮件发送流程
 */
const { chromium } = require('playwright');

async function testEmailFlow() {
  console.log('测试邮件发送流程...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 监听控制台日志
  page.on('console', msg => {
    if (msg.text().includes('[REGISTER]') || msg.text().includes('[Email]') || msg.text().includes('SMTP') || msg.text().includes('email')) {
      console.log('Browser console:', msg.text());
    }
  });

  try {
    // 1. 先测试访问注册页面
    console.log('1. 访问注册页面...');
    await page.goto('http://localhost:3001/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   注册页面加载成功');

    // 2. 填写注册表单
    console.log('2. 填写注册表单...');
    const testEmail = `test_${Date.now()}@gmail.com`; // 用唯一邮箱避免冲突
    console.log('   使用邮箱:', testEmail);

    // 查找表单元素
    const nameInput = await page.$('input[placeholder*="名字"], input[placeholder*="name"], input[id="name"]');
    const emailInput = await page.$('input[type="email"], input[id="email"]');
    const passwordInput = await page.$('input[type="password"], input[id="password"]');

    if (nameInput) {
      await nameInput.fill('测试用户');
      console.log('   名字填写成功');
    }
    if (emailInput) {
      await emailInput.fill(testEmail);
      console.log('   邮箱填写成功');
    }
    if (passwordInput) {
      await passwordInput.fill('TestPassword123!');
      console.log('   密码填写成功');
    }

    // 3. 提交表单
    console.log('3. 提交注册表单...');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/auth/register') || resp.url().includes('/register'), { timeout: 15000 }),
        submitBtn.click()
      ]);
      console.log('   表单提交成功');
    }

    // 4. 等待响应
    await page.waitForTimeout(3000);

    // 5. 检查结果
    const url = page.url();
    console.log('4. 当前URL:', url);

    // 检查是否有错误提示
    const errorText = await page.$eval('body', el => {
      const errorEls = document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]');
      return Array.from(errorEls).map(e => e.textContent).join('; ');
    });

    if (errorText) {
      console.log('   页面错误提示:', errorText);
    }

    console.log('\n✅ 测试完成');
    console.log('请检查控制台日志中是否有:');
    console.log('   - [REGISTER] Attempting to send welcome email');
    console.log('   - [REGISTER] Welcome email sent successfully');
    console.log('   - [REGISTER] Verification email sent');
    console.log('   - SMTP credentials not configured');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testEmailFlow();
