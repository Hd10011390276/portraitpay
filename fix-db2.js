const { spawn } = require('child_process');

const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';
const cwd = 'C:\\Users\\Administrator\\.openclaw\\workspace\\portraitpay';

function run(args) {
  return new Promise((resolve) => {
    const child = spawn('cmd', ['/c', 'npx', '--yes', ...args], {
      cwd,
      env: { ...process.env, FORCE_COLOR: '0' },
      shell: false
    });
    let out = '', err = '';
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.on('close', code => resolve({ code, out, err }));
    child.on('error', e => resolve({ code: -1, out: '', err: e.message }));
  });
}

async function main() {
  // Step 1: rm DATABASE_URL
  console.log('Removing old DATABASE_URL...');
  const rm = await run(['vercel', 'env', 'rm', 'DATABASE_URL', 'production', '--token', token, '--yes']);
  console.log('RM out:', rm.out.substring(0, 200));
  console.log('RM code:', rm.code);

  await new Promise(r => setTimeout(r, 3000));

  // Step 2: add new DATABASE_URL
  console.log('\nAdding new DATABASE_URL...');
  const add = await run(['vercel', 'env', 'add', 'DATABASE_URL', 'production', '--token', token, '--value', dbUrl, '--yes']);
  console.log('ADD out:', add.out.substring(0, 300));
  console.log('ADD err:', add.err.substring(0, 200));
  console.log('ADD code:', add.code);
  
  console.log('\nDone!');
}

main().catch(e => console.log('Error:', e.message));
