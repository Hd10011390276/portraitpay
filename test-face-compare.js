const https = require('https');

function api(method, path, body, headers = {}) {
  return new Promise(resolve => {
    let data = '';
    const opts = { hostname: 'portraitpayai.com', path, method, headers: { 'User-Agent': 'Mozilla/5.0', ...headers } };
    if (body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
      if (!headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
      const req = https.request(opts, res => { res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, body: data })); });
      req.on('error', e => resolve({ status: -1, error: e.message }));
      req.write(bodyStr); req.end();
    } else {
      const req = https.request(opts, res => { res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, body: data })); });
      req.on('error', e => resolve({ status: -1, error: e.message }));
      req.end();
    }
  });
}

async function main() {
  const ts = Date.now();
  const email = 'qatest_' + ts + '@test.com';
  const password = 'Test1234A';
  const name = 'QA Test';

  const reg = await api('POST', '/api/auth/register', { email, password, name, confirmPassword: password, role: 'user', allowLicensing: true, allowedScopes: [], prohibitedContent: [] });
  console.log('Register:', reg.status, JSON.parse(reg.body).message);
  const token = JSON.parse(reg.body).data.accessToken;

  // Test face-compare with minimal fake JPEG
  const boundary = '----WebKitFormBoundary' + ts;
  const fakeJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB]);
  const mpBody = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="portrait"; filename="p.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'),
    fakeJpeg,
    Buffer.from('\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="idCard"; filename="id.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'),
    fakeJpeg,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);

  const fc = await api('POST', '/api/v1/face-compare', mpBody, { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Authorization': 'Bearer ' + token });
  console.log('Face-compare:', fc.status, fc.body.substring(0, 200));
}

main().catch(e => console.log('Error:', e.message));