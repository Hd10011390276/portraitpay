const { spawn } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

// Use the full path to npx.cmd via cmd /c
const cmd = '"' + path + '/node_modules/npm/bin/node-bin/npx.cmd" --yes vercel deploy --token ' + token + ' --prod';

const p = spawn('cmd', ['/c', cmd], {
  cwd: path,
  env: { ...process.env, VERCEL_TOKEN: token },
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
setTimeout(() => { console.log('Timeout'); p.kill(); }, 45000);