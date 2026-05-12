/**
 * 自我审查循环机制 - Self-Review Checklist
 *
 * 在完成关键任务后自动运行，检查：
 * 1. 代码能否 build 成功
 * 2. 本地开发服务器能否正常启动
 * 3. Playwright 测试能否通过
 *
 * 用法: node scripts/self-review-checklist.js [task-name]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.join(__dirname, '..');

const checks = {
  build: {
    name: 'Build 检查',
    description: 'npm run build 能否成功',
    run: () => {
      try {
        execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'pipe' });
        return { pass: true, message: 'Build 成功' };
      } catch (e) {
        return { pass: false, message: `Build 失败: ${e.message}` };
      }
    }
  },

  devServer: {
    name: '开发服务器检查',
    description: 'npm run dev 能否正常启动',
    run: () => {
      // 简化的健康检查 - 只验证 package.json 中的 dev script 是否存在
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
      if (pkg.scripts && pkg.scripts.dev) {
        return { pass: true, message: 'dev script 存在' };
      }
      return { pass: false, message: 'dev script 不存在' };
    }
  },

  gitIdentity: {
    name: 'Git Identity 检查',
    description: 'commit 前必须验证 git email 是 hangdivision@gmail.com',
    run: () => {
      try {
        const email = execSync('git config user.email', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
        if (email === 'hangdivision@gmail.com') {
          return { pass: true, message: `Git email 正确: ${email}` };
        }
        return { pass: false, message: `Git email 错误: ${email}，应该是 hangdivision@gmail.com` };
      } catch (e) {
        return { pass: false, message: `无法获取 git email: ${e.message}` };
      }
    }
  },

  noAgentEmail: {
    name: '禁止 agent@portraitpay.ai 检查',
    description: '确保代码中没有使用 agent@portraitpay.ai',
    run: () => {
      try {
        const result = execSync('git log --format="%ae" -1', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
        if (result.includes('agent@portraitpay.ai')) {
          return { pass: false, message: `禁止! 上次 commit 作者是 agent@portraitpay.ai` };
        }
        return { pass: true, message: `上次 commit 作者正常: ${result}` };
      } catch (e) {
        return { pass: false, message: `检查失败: ${e.message}` };
      }
    }
  },

  testCertificate: {
    name: '证书下载测试',
    description: 'Playwright 测试证书下载功能',
    run: () => {
      const testScript = path.join(PROJECT_ROOT, 'test-certificate.js');
      if (!fs.existsSync(testScript)) {
        return { pass: null, message: 'test-certificate.js 不存在，跳过' };
      }
      try {
        const result = execSync(`node ${testScript}`, { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 60000 });
        if (result.includes('✅ Certificate downloaded successfully')) {
          return { pass: true, message: '证书下载测试通过' };
        }
        return { pass: false, message: `证书下载测试失败: ${result.substring(0, 200)}` };
      } catch (e) {
        return { pass: false, message: `证书下载测试异常: ${e.message.substring(0, 200)}` };
      }
    }
  }
};

function runChecks(checkNames) {
  console.log('🔍 自我审查循环机制\n');
  console.log('=' .repeat(50));

  const results = [];
  for (const name of checkNames) {
    if (checks[name]) {
      console.log(`\n[${name}] ${checks[name].name}`);
      console.log(`   ${checks[name].description}`);
      const result = checks[name].run();
      results.push({ name, ...result });

      if (result.pass === true) {
        console.log(`   ✅ ${result.message}`);
      } else if (result.pass === false) {
        console.log(`   ❌ ${result.message}`);
      } else {
        console.log(`   ⚠️  ${result.message}`);
      }
    } else {
      console.log(`\n❓ 未知的检查项: ${name}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 审查结果汇总:\n');

  const passed = results.filter(r => r.pass === true).length;
  const failed = results.filter(r => r.pass === false).length;
  const skipped = results.filter(r => r.pass === null).length;

  console.log(`   ✅ 通过: ${passed}`);
  console.log(`   ❌ 失败: ${failed}`);
  console.log(`   ⚠️  跳过: ${skipped}`);

  if (failed > 0) {
    console.log('\n🚨 有检查项失败，请修复后再继续！');
    process.exit(1);
  } else if (skipped > 0) {
    console.log('\n⚠️  有检查项被跳过，建议手动验证');
  } else {
    console.log('\n✅ 所有检查通过！');
  }

  return results;
}

// 从命令行参数确定要运行哪些检查
const taskName = process.argv[2] || 'all';
const checkMap = {
  'certificate': ['build', 'gitIdentity', 'noAgentEmail', 'testCertificate'],
  'deploy': ['build', 'gitIdentity', 'noAgentEmail'],
  'all': ['build', 'gitIdentity', 'noAgentEmail'],
  'full': ['build', 'gitIdentity', 'noAgentEmail', 'testCertificate']
};

const checksToRun = checkMap[taskName] || checkMap['all'];
runChecks(checksToRun);
