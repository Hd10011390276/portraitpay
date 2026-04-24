const https = require('https');
const ts = Date.now();
const boundary = '----WebKit' + ts;
const fakeImg = Buffer.from([0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0xFF,0xD9]);
const mp = Buffer.concat([
  Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="portrait"; filename="p.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'),
  fakeImg,
  Buffer.from('\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="idCard"; filename="id.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'),
  fakeImg,
  Buffer.from('\r\n--' + boundary + '--\r\n')
]);

const regBody = JSON.stringify({ email: 'qa2_'+ts+'@test.com', password: 'Test1234A', name: 'QA', confirmPassword: 'Test1234A', role: 'user', allowLicensing: true, allowedScopes: [], prohibitedContent: [] });
let regData = '';
const regReq = https.request({
  hostname: 'portraitpayai.com', path: '/api/auth/register', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(regBody) }
}, res => { res.on('data', c => regData += c); res.on('end', () => {
  const r = JSON.parse(regData);
  if (r.success) {
    const tok = r.data.accessToken;
    let fcData = '';
    const fcReq = https.request({
      hostname: 'portraitpayai.com', path: '/api/v1/face-compare', method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Authorization': 'Bearer ' + tok, 'Content-Length': mp.length }
    }, fcRes => { fcRes.on('data', c => fcData += c); fcRes.on('end', () => console.log('Face-compare:', fcRes.statusCode, fcData.substring(0, 200))); });
    fcReq.on('error', e => console.log('ERR:', e.message));
    fcReq.write(mp); fcReq.end();
  } else { console.log('Reg failed:', regData.substring(0, 300)); }
}); });
regReq.on('error', e => console.log('ERR:', e.message));
regReq.write(regBody); regReq.end();