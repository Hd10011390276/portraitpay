const https = require('https');
const body = JSON.stringify({ email: 'test@test.com', password: 'wrong' });
let data = '';
const req = https.request({
  hostname: 'portraitpayai.com', path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, res => { res.on('data', c => data += c); res.on('end', () => console.log('Login:', res.statusCode, data.substring(0, 150))); });
req.on('error', e => console.log(e.message));
req.write(body);
req.end();
