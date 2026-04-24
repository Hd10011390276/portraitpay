const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const sha = '9da143c519f4567ab05a11dbc15c75a3c8174416';
const body = JSON.stringify({ name: 'portraitpay', gitSource: { type: 'github', repo: 'Hd10011390276/portraitpay', ref: 'main', sha: sha, repoId: 1196064714 }, target: 'production' });
let data = '';
const req = https.request({ hostname: 'api.vercel.com', path: '/v13/deployments', method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => { res.on('data', c => data += c); res.on('end', () => { const j = JSON.parse(data); console.log('Deploy:', j.id, j.readyState); }); });
req.on('error', e => console.log(e.message)); req.write(body); req.end();
