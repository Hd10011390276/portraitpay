const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const id = 'dpl_4RF6Q4FzmcfJ8dUNADRmWFcemmMY';

function check() {
  let d = '';
  https.get({ hostname: 'api.vercel.com', path: '/v13/deployments/' + id, headers: { Authorization: 'Bearer ' + token } }, r => {
    r.on('data', c => d += c);
    r.on('end', () => {
      try {
        const j = JSON.parse(d);
        console.log(new Date().toISOString(), j.readyState, j.errorMessage || '');
        if (j.readyState === 'READY') {
          testLogin();
        } else if (j.readyState === 'ERROR') {
          console.log('Deploy ERROR:', j.errorMessage);
          process.exit(1);
        } else {
          d = '';
          setTimeout(check, 20000);
        }
      } catch (e) {
        console.log('Parse error, retrying...');
        d = '';
        setTimeout(check, 20000);
      }
    });
  }).on('error', e => { console.log(e.message); setTimeout(check, 20000); });
}

function testLogin() {
  const body = JSON.stringify({ email: 'test@test.com', password: 'wrong' });
  let d2 = '';
  const req = https.request({
    hostname: 'portraitpayai.com', path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, res => {
    res.on('data', c => d2 += c);
    res.on('end', () => {
      console.log('\nLogin test:', res.statusCode, d2.substring(0, 100));
      if (res.statusCode === 401) console.log('✅ Login works!');
      else if (res.statusCode === 500) console.log('❌ Still 500 - DATABASE_URL issue persists');
      else console.log('Status:', res.statusCode);
      process.exit(0);
    });
  });
  req.on('error', e => { console.log('ERR:', e.message); process.exit(1); });
  req.write(body);
  req.end();
}

console.log('Watching:', id);
check();
