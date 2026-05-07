const https = require('https');

const loginData = JSON.stringify({ email: '799096322@qq.com', password: 'Hd210011390276' });

const loginReq = https.request({
  hostname: 'portraitpayai.com',
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
}, (loginRes) => {
  let loginBody = '';
  loginRes.on('data', c => loginBody += c);
  loginRes.on('end', () => {
    const token = JSON.parse(loginBody).data?.accessToken;
    console.log('Logged in');
    
    const portraitId = 'cmov61fqr000jfgzksk1udphc';
    const body = JSON.stringify({});

    const certifyReq = https.request({
      hostname: 'portraitpayai.com',
      path: '/api/portraits/' + portraitId + '/certify',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (certifyRes) => {
      let cb = '';
      certifyRes.on('data', c => cb += c);
      certifyRes.on('end', () => {
        console.log('Status:', certifyRes.statusCode);
        console.log('Response:', cb.slice(0, 600));
        process.exit(0);
      });
    });

    certifyReq.setTimeout(90000, () => { console.log('TIMEOUT'); process.exit(1); });
    certifyReq.on('error', e => { console.error('Error:', e.message); process.exit(1); });
    certifyReq.end(body);
  });
});

loginReq.on('error', e => { console.error(e.message); process.exit(1); });
loginReq.end(loginData);