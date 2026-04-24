const { spawn } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

console.log('Starting Vercel deploy via npx...');

const p = spawn('cmd', ['/c', 'npx.cmd', '--yes', 'vercel', 'deploy', '--prod', '--token', token], {
  cwd: path,
  env: { ...process.env, VERCEL_TOKEN: token },
  stdio: ['pipe', 'pipe', 'pipe']
});

let out = '', err = '';
p.stdout.on('data', d => out += d.toString());
p.stderr.on('data', d => err += d.toString());
p.on('close', code => {
  console.log('Exit:', code);
  console.log('STDOUT:', out.substring(0, 1000));
  console.log('STDERR:', err.substring(0, 500));
});
p.on('error', e => console.log('Error:', e.message));
setTimeout(() => { console.log('Timeout'); p.kill(); }, 50000);