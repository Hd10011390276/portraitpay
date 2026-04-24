const { spawn } = require('child_process');
const path = require('path');

const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';
const cwd = 'C:\\Users\\Administrator\\.openclaw\\workspace\\portraitpay';

function run(args, envExtra = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...envExtra };
    const child = spawn('npx.cmd', ['--yes', ...args], {
      cwd,
      env,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let out = '', err = '';
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.on('close', code => resolve({ code, out, err }));
    child.on('error', reject);
    // Send 'y' for interactive prompts
    setTimeout(() => child.stdin.write('y\n'), 500);
  });
}

async function main() {
  console.log('Step 1: Remove old DATABASE_URL...');
  const rm = await run(['vercel', 'env', 'rm', 'DATABASE_URL', 'production', '--token', token, '--yes']);
  console.log('RM out:', rm.out.substring(0, 300));
  console.log('RM err:', rm.err.substring(0, 300));
  console.log('RM code:', rm.code);

  // Small delay
  await new Promise(r => setTimeout(r, 2000));

  console.log('\nStep 2: Add new DATABASE_URL...');
  const add = await run(['vercel', 'env', 'add', 'DATABASE_URL', 'production', '--token', token, '--value', dbUrl, '--yes']);
  console.log('ADD out:', add.out.substring(0, 300));
  console.log('ADD err:', add.err.substring(0, 300));
  console.log('ADD code:', add.code);
}

main().catch(e => console.log('Error:', e.message));
