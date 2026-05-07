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
    
    const certReq = https.request({
      hostname: 'portraitpayai.com',
      path: '/api/portraits/cmov3bdn60001ecx4cjv9pt07/certificate',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (certRes) => {
      console.log('Status:', certRes.statusCode);
      let cb = '';
      certRes.on('data', c => cb += c);
      certRes.on('end', () => {
        console.log('Response:', cb.slice(0, 500));
        process.exit(0);
      });
    });
    certReq.on('error', e => { console.error(e.message); process.exit(1); });
    certReq.end();
  });
});

loginReq.on('error', e => { console.error(e.message); process.exit(1); });
loginReq.end(loginData);