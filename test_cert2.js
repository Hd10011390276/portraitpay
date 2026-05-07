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
    console.log('Token length:', token?.length);
    
    // Try simple GET first without the certificate route
    const req = https.request({
      hostname: 'portraitpayai.com',
      path: '/api/portraits/cmov3bdn60001ecx4cjv9pt07/certificate',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    }, (res) => {
      console.log('Status:', res.statusCode);
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log('Headers:', JSON.stringify(res.headers).slice(0,200));
        console.log('Body:', data.slice(0, 500));
      });
    });
    req.setTimeout(30000, () => console.log('TIMEOUT'));
    req.on('error', e => console.log('Error:', e.message));
    req.end();
  });
});

loginReq.on('error', e => console.log('Login error:', e.message));
loginReq.end(loginData);