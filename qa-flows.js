const https = require('https');

function api(method, path, body, headers = {}) {
  return new Promise((resolve) => {
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
  const email = `qa_${ts}@test.com`;
  const password = 'Test1234A';
  const name = 'QA Test';

  console.log('=== 1. Register ===');
  const reg = await api('POST', '/api/auth/register', { email, password, name, confirmPassword: password, role: 'user', allowLicensing: true, allowedScopes: [], prohibitedContent: [] });
  console.log('Register:', reg.status, typeof reg.body === 'string' ? reg.body.substring(0, 300) : reg.body);
  
  if (reg.status !== 201 && reg.status !== 200) {
    console.log('❌ Registration failed, trying login...');
    const login = await api('POST', '/api/auth/login', { email, password });
    console.log('Login:', login.status, login.body.substring(0, 200));
    return;
  }
  
  const regJson = JSON.parse(reg.body);
  const token = regJson.data?.accessToken;
  if (!token) { console.log('❌ No token received'); return; }
  console.log('✅ Token received:', token.substring(0, 20) + '...');
  
  console.log('\n=== 2. Face Compare API (with token) ===');
  // Create minimal multipart form data with fake image
  const boundary = '----WebKitFormBoundary' + ts;
  const mp = `--${boundary}\r\nContent-Disposition: form-data; name="portrait"; filename="portrait.jpg"\r\nContent-Type: image/jpeg\r\n\r\n\xFF\xD8\xFF\xE0fake-jpeg\xFF\xD9\r\n--${boundary}\r\nContent-Disposition: form-data; name="idCard"; filename="idcard.jpg"\r\nContent-Type: image/jpeg\r\n\r\n\xFF\xD8\xFF\xE0fake-jpeg\xFF\xD9\r\n--${boundary}--\r\n`;
  
  const fc = await api('POST', '/api/v1/face-compare', mp, { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Authorization': 'Bearer ' + token });
  console.log('Face-compare:', fc.status, fc.body.substring(0, 300));
  
  console.log('\n=== 3. GET /api/auth/me ===');
  const me = await api('GET', '/api/auth/me', null, { 'Authorization': 'Bearer ' + token });
  console.log('Me:', me.status, me.body.substring(0, 200));
  
  console.log('\n=== 4. Portraits List ===');
  const portraits = await api('GET', '/api/portraits', null, { 'Authorization': 'Bearer ' + token });
  console.log('Portraits:', portraits.status, portraits.body.substring(0, 200));
  
  console.log('\n=== 5. KYC Init ===');
  const kyc = await api('POST', '/api/v1/kyc/init', {}, { 'Authorization': 'Bearer ' + token });
  console.log('KYC init:', kyc.status, kyc.body.substring(0, 300));
  
  console.log('\n=== Done ===');
}

main().catch(e => console.log('Error:', e.message));
