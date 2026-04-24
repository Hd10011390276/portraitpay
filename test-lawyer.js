const https = require('https');

// Test GET /api/lawyers/apply
let d = '';
https.get({ hostname: 'portraitpayai.com', path: '/api/lawyers/apply', timeout: 10000 }, r => {
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('GET Status:', r.statusCode, 'Body:', d.substring(0, 100));
    testPost();
  });
}).on('error', e => { console.log('ERR:', e.message); process.exit(0); });

function testPost() {
  const body = JSON.stringify({ companyName: 'Test Law', region: '华北地区', contactName: 'Zhang', contactEmail: 'test@test.com', contactPhone: '1234567890' });
  let d2 = '';
  const req = https.request({
    hostname: 'portraitpayai.com',
    path: '/api/lawyers/apply',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, r => {
    r.on('data', c => d2 += c);
    r.on('end', () => {
      console.log('POST Status:', r.statusCode, 'Body:', d2.substring(0, 150));
      process.exit(0);
    });
  });
  req.on('error', e => { console.log('POST ERR:', e.message); process.exit(0); });
  req.write(body);
  req.end();
}
