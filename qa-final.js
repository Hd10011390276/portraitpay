const https = require('https');

const BASE = 'portraitpayai.com';
const timestamp = Date.now();
const testEmail = `qa_final_${timestamp}@test.com`;

function req(method, path, headers = {}, body = null) {
  return new Promise((resolve) => {
    const opt = {
      hostname: BASE, port: 443, path, method,
      headers: { 'Content-Type': 'application/json', ...headers },
      rejectUnauthorized: false
    };
    const r = https.request(opt, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    r.on('error', e => resolve({ status: 'ERR:' + e.message, body: '' }));
    if (body) r.write(body);
    r.end();
  });
}

async function run() {
  console.log('=== PortraitPay QA Report ===\n');

  // Public pages
  console.log('--- Public Pages ---');
  const pages = ['/', '/login', '/register', '/forgot-password', '/terms', '/privacy', '/contact', '/celebrity', '/enterprise/authorization/apply', '/enterprise/lawyer-registration'];
  for (const p of pages) {
    const r = await req('GET', p);
    console.log(`${p}: ${r.status}`);
  }

  // Protected pages (redirect)
  console.log('\n--- Protected Pages (expect 307) ---');
  for (const p of ['/dashboard', '/portraits', '/portraits/upload', '/earnings', '/settings']) {
    const r = await req('GET', p);
    console.log(`${p}: ${r.status} ${r.headers.location || ''}`);
  }

  // API tests
  console.log('\n--- API Tests ---');

  // Login (wrong pass)
  const lr = await req('POST', '/api/auth/login', {}, JSON.stringify({ email: 'test@test.com', password: 'wrong' }));
  console.log(`POST /api/auth/login (wrong pass): ${lr.status} - ${lr.body.substring(0, 60)}`);

  // Register
  const rr = await req('POST', '/api/auth/register', {}, JSON.stringify({ email: testEmail, password: 'Test123456!', name: 'QA User', confirmPassword: 'Test123456!' }));
  console.log(`POST /api/auth/register: ${rr.status} - ${rr.body.substring(0, 80)}`);
  let token = '';
  try { token = JSON.parse(rr.body).data?.accessToken || JSON.parse(rr.body).accessToken || ''; } catch (e) {}
  if (token) console.log('Token:', token.substring(0, 15) + '...');

  // If registered, test authenticated endpoints
  if (token) {
    const h = { Authorization: `Bearer ${token}` };

    // Get portraits
    const pr = await req('GET', '/api/portraits', h);
    console.log(`\nGET /api/portraits: ${pr.status}`);
    let portraitId = '';
    try {
      const pd = JSON.parse(pr.body);
      if (pd.data?.[0]?.id) portraitId = pd.data[0].id;
    } catch (e) {}

    // Create portrait
    if (!portraitId) {
      const cp = await req('POST', '/api/portraits', h, JSON.stringify({ name: 'QA Portrait Test', description: 'Test' }));
      console.log(`POST /api/portraits: ${cp.status} - ${cp.body.substring(0, 80)}`);
      try { portraitId = JSON.parse(cp.body).data?.id || ''; } catch (e) {}
    } else {
      console.log(`Using existing portrait: ${portraitId.substring(0, 10)}...`);
    }

    // Face compare (with portrait)
    if (portraitId) {
      const fc = await req('POST', '/api/v1/face-compare', h, JSON.stringify({ portraitId, imageUrl: 'https://example.com/test.jpg' }));
      console.log(`POST /api/v1/face-compare: ${fc.status} - ${fc.body.substring(0, 80)}`);

      // Blockchain certify
      const cert = await req('POST', `/api/portraits/${portraitId}/certify`, h, '{}');
      console.log(`POST /api/portraits/${portraitId}/certify: ${cert.status} - ${cert.body.substring(0, 150)}`);
    }
  } else {
    console.log('\n(No token - skipping portrait tests)');
  }

  // Lawyer registration (no auth needed)
  console.log('\n--- Lawyer Registration API (no auth) ---');
  const lawyer = await req('POST', '/api/lawyers/apply', {}, JSON.stringify({
    companyName: '北京君合律师事务所',
    region: '华北地区（北京、天津、河北、山西、内蒙古）',
    contactName: '张律师',
    contactEmail: `lawyer_${timestamp}@test.com`,
    contactPhone: '+86 10 12345678'
  }));
  console.log(`POST /api/lawyers/apply: ${lawyer.status} - ${lawyer.body.substring(0, 100)}`);

  // Forgot password
  const fp = await req('POST', '/api/auth/forgot-password', {}, JSON.stringify({ email: 'test@test.com' }));
  console.log(`\nPOST /api/auth/forgot-password: ${fp.status} - ${fp.body.substring(0, 80)}`);

  console.log('\n=== QA Complete ===');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
