const { spawn } = require('child_process');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const authSecret = require('crypto').randomBytes(32).toString('base64');

// Use node to run vercel binary directly
const vercelBin = 'C:\\Users\\Administrator\\AppData\\Roaming\\npm\\node_modules\\vercel\\bin\\vercel.js';
const args = ['env', 'add', 'DATABASE_URL', 'production', '--token', token];
const proc = spawn('node', [vercelBin, ...args], {
  cwd: 'C:/Users/Administrator/.openclaw/workspace/portraitpay',
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, VERCEL_TOKEN: token }
});

let stdout = '', stderr = '';
proc.stdout.on('data', d => { stdout += d; process.stdout.write(d); });
proc.stderr.on('data', d => { stderr += d; process.stderr.write(d); });
proc.on('close', code => { console.log('\nExit:', code); });
proc.on('error', e => console.log('Spawn error:', e.message));

// Send value when prompted
setTimeout(() => {
  proc.stdin.write(dbUrl + '\n');
  setTimeout(() => {
    // Say no to preview
    proc.stdin.write('n\n');
    setTimeout(() => {
      // Say yes to production
      proc.stdin.write('y\n');
    }, 1000);
  }, 1000);
}, 2000);

setTimeout(() => {
  if (!proc.killed) proc.kill();
}, 15000);
