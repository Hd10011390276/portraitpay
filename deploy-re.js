const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const sha = '8d8e730eee03c4228a3d9b7e229546a853c62e66';
const body = JSON.stringify({
  name: 'portraitpay',
  gitSource: {
    type: 'github',
    repo: 'Hd10011390276/portraitpay',
    ref: 'main',
    sha: sha,
    repoId: 1196064714
  },
  target: 'production'
});

let data = '';
const req = https.request({
  hostname: 'api.vercel.com',
  path: '/v13/deployments',
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, res => {
  res.on('data', c => data += c);
  res.on('end', () => {
    const j = JSON.parse(data);
    console.log('Deploy triggered:', j.id, j.readyState || 'QUEUED');
    process.exit(0);
  });
});
req.on('error', e => { console.log('Error:', e.message); process.exit(1); });
req.write(body);
req.end();
