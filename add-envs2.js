const { spawn } = require('child_process');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const cwd = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';

// Use echo to pipe 'y' to vercel env add
const envVars = [
  { name: 'DATABASE_URL', value: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' },
  { name: 'AUTH_SECRET', value: 'Ta8gZ2Q6WJ4X3m9K7hR5N2P8E1F4L7A0D3C6B9X2Y5M8N1Q4W7Z0A3B6' },
  { name: 'AUTH_URL', value: 'https://portraitpayai.com' },
  { name: 'NEXTAUTH_URL', value: 'https://portraitpayai.com' },
];

let idx = 0;
function run() {
  if (idx >= envVars.length) { console.log('All env vars added!'); return; }
  const { name, value } = envVars[idx++];
  console.log('Adding:', name);
  
  // Use echo to provide 'y' for overwrite confirmation
  const cmd = `echo y | npx.cmd --yes vercel env add ${name} production --token ${token}`;
  
  const p = spawn('cmd', ['/c', cmd], { 
    cwd, 
    env: { ...process.env, VERCEL_TOKEN: token, DATABASE_URL: value, AUTH_SECRET: value, AUTH_URL: value, NEXTAUTH_URL: value },
    stdio: ['pipe', 'pipe', 'pipe'] 
  });
  
  let out = '', err = '';
  p.stdout.on('data', d => out += d.toString());
  p.stderr.on('data', d => err += d.toString());
  p.on('close', code => {
    console.log(name, 'Exit:', code);
    console.log('OUT:', out.substring(0, 300));
    console.log('ERR:', err.substring(0, 200));
    setTimeout(run, 3000);
  });
  p.on('error', e => { console.log('Error:', e.message); setTimeout(run, 3000); });
}

run();