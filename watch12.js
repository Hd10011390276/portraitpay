const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const id = 'dpl_AfXRnsSY9Sjud4Xq3jWchMfEAaRR';

function check() {
  let data = '';
  https.get({
    hostname: 'api.vercel.com', 
    path: '/v13/deployments/' + id,
    headers: { Authorization: 'Bearer ' + token }
  }, res => {
    res.on('data', c => data += c);
    res.on('end', () => {
      const j = JSON.parse(data);
      const state = j.readyState;
      console.log(new Date().toISOString(), '|', state);
      if (state === 'READY') {
        console.log('\n✅ Deploy ready! Testing login...');
        const https2 = require('https');
        const body2 = JSON.stringify({ email: 'test@test.com', password: 'wrong' });
        let d2 = '';
        const req2 = https2.request({
          hostname: 'portraitpayai.com', path: '/api/auth/login', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body2) }
        }, res2 => { res2.on('data', c => d2 += c); res2.on('end', () => console.log('Login test:', res2.statusCode, d2.substring(0, 100))); });
        req2.on('error', e => console.log(e.message));
        req2.write(body2);
        req2.end();
        process.exit(0);
      } else if (state === 'ERROR') {
        console.log('\n❌ Deploy failed:', j.errorMessage);
        process.exit(1);
      } else {
        setTimeout(check, 20000);
      }
    });
  }).on('error', e => { console.log('Error:', e.message); setTimeout(check, 20000); });
}

console.log('Watching:', id);
check();
