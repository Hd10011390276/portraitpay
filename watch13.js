const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const id = 'dpl_EbY2kiqsxkmmNsp4x16UVj3zC9aR';
function check() {
  let d = '';
  https.get({ hostname: 'api.vercel.com', path: '/v13/deployments/' + id, headers: { Authorization: 'Bearer ' + token } }, r => {
    r.on('data', c => d += c);
    r.on('end', () => {
      const j = JSON.parse(d);
      console.log(new Date().toISOString(), j.readyState, j.errorMessage || '');
      if (j.readyState === 'READY') { console.log('DONE'); process.exit(0); }
      else if (j.readyState === 'ERROR') { console.log('ERROR:', j.errorMessage); process.exit(1); }
      else setTimeout(check, 20000);
    });
  }).on('error', e => { console.log(e.message); setTimeout(check, 20000); });
}
check();