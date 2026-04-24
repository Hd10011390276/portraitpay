const { spawn } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';

// Try to add DATABASE_URL using Vercel CLI with --token flag
console.log('Testing Vercel CLI with token...');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

// Use vercel CLI to pull current env (this shows what project it's linked to)
const p = spawn('npx', ['vercel', 'env', 'ls', '--token', token, '--debug'], {
  cwd: path,
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

let out = '', err = '';
p.stdout.on('data', d => out += d.toString());
p.stderr.on('data', d => err += d.toString());
p.on('close', code => {
  console.log('Exit:', code);
  console.log('STDOUT:', out.substring(0, 500));
  console.log('STDERR:', err.substring(0, 500));
});
p.on('error', e => console.log('Error:', e.message));
setTimeout(() => { console.log('Timeout'); p.kill(); }, 20000);