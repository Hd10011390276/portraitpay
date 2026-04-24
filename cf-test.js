const https = require('https');

const ACCOUNT_ID = 'b0d0ec3c3f9bc0e681ded21e2126bab2';
const API_TOKEN = 'cfat_OEsxqF2iJzOfTY8iAaxLxgWfKV4LEgmFZwoFQwQE78684cc9';
const BUCKET_NAME = 'portraitpay-uploads';

function api(method, path, body) {
  return new Promise((resolve) => {
    let data = '';
    const opts = {
      hostname: 'api.cloudflare.com',
      path,
      method,
      headers: {
        'Authorization': 'Bearer ' + API_TOKEN,
        'Content-Type': 'application/json'
      }
    };
    if (body) {
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(opts, res => {
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', e => resolve({ status: -1, body: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  // Test 1: Get bucket info
  const info = await api('GET', `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}`);
  console.log('1. GET bucket info:', info.status, info.body.substring(0, 200));
  
  // Test 2: Try CORS with empty array first
  const empty = await api('PUT', `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`, '[]');
  console.log('2. PUT CORS (empty):', empty.status, empty.body.substring(0, 200));
  
  // Test 3: Try without Content-Length
  const optsNoLen = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`,
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + API_TOKEN,
      'Content-Type': 'application/json'
    }
  };
  const body3 = '[{"AllowedOrigins":["https://portraitpayai.com"],"AllowedMethods":["GET","PUT","POST","HEAD"],"AllowedHeaders":["Content-Type"]}]';
  await new Promise((resolve) => {
    let data = '';
    const req = https.request(optsNoLen, res => {
      res.on('data', c => data += c);
      res.on('end', () => { console.log('3. PUT no len:', res.statusCode, data.substring(0, 200)); resolve(); });
    });
    req.on('error', e => { console.log('ERR:', e.message); resolve(); });
    req.write(body3);
    req.end();
  });
})();
