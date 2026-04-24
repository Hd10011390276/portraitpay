const { spawn } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

const envs = [
  { key: 'DATABASE_URL', value: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', type: 'secret' },
  { key: 'AUTH_SECRET', value: 'Ta8gZ2Q6WJ4X3m9K7hR5N2P8E1F4L7A0D3C6B9X2Y5M8N1Q4W7Z0A3B6', type: 'secret' },
  { key: 'AUTH_URL', value: 'https://portraitpayai.com', type: 'plain' },
  { key: 'NEXTAUTH_URL', value: 'https://portraitpayai.com', type: 'plain' }
];

let idx = 0;

function addNext() {
  if (idx >= envs.length) {
    console.log('All env vars set. Triggering redeploy...');
    // Trigger redeploy via API
    const { https } = require('https');
    const gitSource = { type: 'github', repo: 'Hd10011390276/portraitpay-frontend', ref: 'main', repoId: 1192767896 };
    const bodyStr = JSON.stringify({ name: 'portraitpay-frontend', gitSource, target: 'production' });
    const opts = {
      hostname: 'api.vercel.com', path: '/v13/deployments', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
    };
    let data = '';
    const req = https.request(opts, res => { res.on('data', c => data += c); res.on('end', () => { const j = JSON.parse(data); console.log('Deploy:', j.id, j.readyState, j.url); }); });
    req.on('error', e => console.log(e.message));
    req.write(bodyStr);
    req.end();
    return;
  }
  
  const e = envs[idx++];
  console.log('Adding:', e.key);
  
  // Use Vercel CLI to add env var
  const p = spawn('npx', ['vercel', 'env', 'add', e.key, e.type, '--token', token, '--yes'], {
    cwd: path,
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let out = '', err = '';
  p.stdout.on('data', d => out += d);
  p.stderr.on('data', d => err += d);
  p.on('close', code => {
    console.log('  exit:', code, 'out:', out.substring(0, 200), 'err:', err.substring(0, 200));
    // Try with echo to pipe the value
    if (code !== 0) {
      console.log('  Trying with piped value...');
      const p2 = spawn('echo', [e.value], { shell: true });
      let val = '';
      p2.stdout.on('data', d => val += d);
      p2.on('close', () => {
        const p3 = spawn('npx', ['vercel', 'env', 'add', e.key, e.type, '--token', token, '--yes'], {
          cwd: path,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        p3.stdin.write(e.value + '\n');
        p3.stdin.end();
        let out2 = '', err2 = '';
        p3.stdout.on('data', d => out2 += d);
        p3.stderr.on('data', d => err2 += d);
        p3.on('close', c2 => {
          console.log('  piped exit:', c2, 'out:', out2.substring(0, 200), 'err:', err2.substring(0, 200));
          addNext();
        });
      });
    } else {
      addNext();
    }
  });
  
  // Timeout
  setTimeout(() => { p.kill(); addNext(); }, 15000);
}

addNext();