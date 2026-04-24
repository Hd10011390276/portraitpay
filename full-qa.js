const https = require('https');

// Register a test user
const timestamp = Date.now();
const email = `qa_test_${timestamp}@test.com`;

function post(path, body, headers = {}) {
  return new Promise((resolve) => {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request({
      hostname: 'portraitpayai.com', path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...headers }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', e => resolve({ status: 'ERR:' + e.message, body: '' }));
    req.write(bodyStr);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve) => {
    const req = https.get({
      hostname: 'portraitpayai.com', path, timeout: 10000, headers
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', e => resolve({ status: 'ERR:' + e.message, body: '' }));
  });
}

async function run() {
  console.log('=== PortraitPay QA Report ===\n');

  // Test 1: Public pages
  const publicPages = ['/', '/login', '/register', '/forgot-password', '/terms', '/privacy', '/contact', '/celebrity', '/enterprise/authorization/apply', '/enterprise/lawyer-registration'];
  console.log('--- Public Pages ---');
  for (const p of publicPages) {
    const r = await get(p);
    console.log(`${p}: ${r.status}`);
  }

  // Test 2: Protected pages (should redirect - 307)
  console.log('\n--- Protected Pages (should redirect to login) ---');
  for (const p of ['/dashboard', '/portraits', '/portraits/upload', '/earnings', '/settings']) {
    const r = await get(p);
    console.log(`${p}: ${r.status} (expected 307)`);
  }

  // Test 3: Register a test user
  console.log('\n--- User Registration ---');
  const regRes = await post('/api/auth/register', { email, password: 'Test123456!', name: 'QA Test User' });
  console.log(`POST /api/auth/register: ${regRes.status} - ${regRes.body.substring(0, 80)}`);

  // Test 4: Login
  console.log('\n--- User Login ---');
  const loginRes = await post('/api/auth/login', { email, password: 'Test123456!' });
  console.log(`POST /api/auth/login: ${loginRes.status}`);
  let token = '';
  try { token = JSON.parse(loginRes.body).data?.accessToken || JSON.parse(loginRes.body).accessToken || ''; } catch(e) {}
  if (!token) { console.log('No token, trying to parse:', loginRes.body.substring(0, 100)); }
  else { console.log('Got token:', token.substring(0, 20) + '...'); }

  // Test 5: Authenticated API calls
  if (token) {
    console.log('\n--- Authenticated API Tests ---');
    const h = { Authorization: `Bearer ${token}` };
    
    const portraitsRes = await get('/api/portraits', h);
    console.log(`GET /api/portraits: ${portraitsRes.status}`);

    // Test face compare (POST with FormData is complex via raw https, skip)
    const fcRes = await post('/api/v1/face-compare', { portraitId: 'test' }, h);
    console.log(`POST /api/v1/face-compare: ${fcRes.status} - ${fcRes.body.substring(0, 80)}`);

    // Test forgot password
    const fpRes = await post('/api/auth/forgot-password', { email: 'test@test.com' });
    console.log(`POST /api/auth/forgot-password: ${fpRes.status} - ${fpRes.body.substring(0, 60)}`);
  }

  // Test 6: Lawyer registration (no auth)
  console.log('\n--- Lawyer Registration API ---');
  const lawyerRes = await post('/api/lawyers/apply', {
    companyName: 'Test Law Firm QA',
    region: '华北地区',
    contactName: 'QA Tester',
    contactEmail: 'qa_lawyer@test.com',
    contactPhone: '+86 1234567890'
  });
  console.log(`POST /api/lawyers/apply: ${lawyerRes.status} - ${lawyerRes.body.substring(0, 100)}`);

  // Test 7: Blockchain certify (stub - no real contract)
  console.log('\n--- Blockchain Certify (stub expected) ---');
  // First get a portrait ID from the portraits list if we have one
  let portraitId = '';
  if (token) {
    const h = { Authorization: `Bearer ${token}` };
    const pr = await get('/api/portraits', h);
    try {
      const data = JSON.parse(pr.body);
      if (data.data?.[0]?.id) portraitId = data.data[0].id;
    } catch(e) {}
  }
  if (portraitId) {
    const certRes = await post(`/api/portraits/${portraitId}/certify`, {}, { Authorization: `Bearer ${token}` });
    console.log(`POST /api/portraits/${portraitId}/certify: ${certRes.status} - ${certRes.body.substring(0, 150)}`);
  } else {
    console.log('No portrait found to test certify');
  }

  console.log('\n=== QA Complete ===');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
