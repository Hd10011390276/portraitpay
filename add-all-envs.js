const fs = require('fs');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const authSecret = 'Ta8gZ2Q6WJ4X3m9K7hR5N2P8E1F4L7A0D3C6B9X2Y5M8N1Q4W7Z0A3B6';
const { spawn } = require('child_process');

const env = { ...process.env, VERCEL_TOKEN: token };

const envs = [
  { name: 'DATABASE_URL', value: dbUrl, type: 'secret' },
  { name: 'AUTH_SECRET', value: authSecret, type: 'secret' },
  { name: 'AUTH_URL', value: 'https://portraitpayai.com', type: 'plain' },
  { name: 'NEXTAUTH_URL', value: 'https://portraitpayai.com', type: 'plain' }
];

let idx = 0;

function addNext() {
  if (idx >= envs.length) {
    console.log('\n=== All envs added! Triggering redeploy ===');
    const { https } = require('https');
    const gitSource = { type: 'github', repo: 'Hd10011390276/portraitpay-frontend', ref: 'main', repoId: 1192767896 };
    const bodyStr = JSON.stringify({ name: 'portraitpay-frontend', gitSource, target: 'production' });
    const opts = {
      hostname: 'api.vercel.com', path: '/v13/deployments', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
    };
    let data = '';
    const req = https.request(opts, res => {
      res.on('data', c => data += c);
      res.on('end', () => {
        const j = JSON.parse(data);
        console.log('Deploy ID:', j.id);
        console.log('State:', j.readyState);
        console.log('URL:', j.url);
        console.log('Commit:', j.meta?.githubCommitSha);
      });
    });
    req.on('error', e => console.log('Error:', e.message));
    req.write(bodyStr);
    req.end();
    return;
  }
  
  const e = envs[idx++];
  console.log('[' + idx + '] Adding', e.name + '...');
  
  const p = spawn('npx', ['vercel', 'env', 'add', e.name, e.type, 'production', '--yes'], {
    cwd: path,
    env: env,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let out = '', err = '';
  p.stdout.on('data', d => out += d.toString());
  p.stderr.on('data', d => err += d.toString());
  p.on('close', code => {
    console.log('  exit:', code, '| out:', out.substring(0, 150), '| err:', err.substring(0, 200));
    setTimeout(addNext, 1000);
  });
  p.on('error', e => { console.log('  error:', e.message); addNext(); });
  setTimeout(() => { p.kill(); addNext(); }, 20000);
}

addNext();