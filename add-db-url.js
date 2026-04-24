const { spawn, execSync } = require('child_process');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const cwd = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function run(cmd, args, input) {
  return new Promise((resolve) => {
    console.log('Running:', cmd, args.join(' '));
    const p = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', d => out += d.toString());
    p.stderr.on('data', d => err += d.toString());
    if (input) p.stdin.write(input + '\n');
    p.stdin.end();
    p.on('close', code => {
      console.log('Exit:', code);
      if (out) console.log('OUT:', out.substring(0, 500));
      if (err) console.log('ERR:', err.substring(0, 200));
      resolve({ code, out, err });
    });
    p.on('error', e => { console.log('Error:', e.message); resolve({ code: -1 }); });
  });
}

async function main() {
  // Add DATABASE_URL with 'y' to confirm overwrite
  const r = await run('npx.cmd', ['--yes', 'vercel', 'env', 'add', 'DATABASE_URL', 'production', '--token', token], dbUrl);
  console.log('DATABASE_URL add result:', r.code);
  
  // Add AUTH_SECRET
  const r2 = await run('npx.cmd', ['--yes', 'vercel', 'env', 'add', 'AUTH_SECRET', 'production', '--token', token], 'Ta8gZ2Q6WJ4X3m9K7hR5N2P8E1F4L7A0D3C6B9X2Y5M8N1Q4W7Z0A3B6');
  console.log('AUTH_SECRET add result:', r2.code);
  
  console.log('Done!');
}
main();