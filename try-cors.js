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
        'Content-Type': 'application/json',
        'Content-Length': body ? Buffer.byteLength(body) : 0
      }
    };
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
  // Try various CORS body formats
  const formats = [
    // Format 1: Array with minimal fields
    JSON.stringify([{ allowedOrigins: ['https://portraitpayai.com'], allowedMethods: ['GET'], allowedHeaders: ['content-type'] }]),
    // Format 2: Object with cors array
    JSON.stringify({ cors: [{ allowedOrigins: ['https://portraitpayai.com'], allowedMethods: ['GET'], allowedHeaders: ['content-type'] }] }),
    // Format 3: Single object (not array)
    JSON.stringify({ allowedOrigins: ['https://portraitpayai.com'], allowedMethods: ['GET'], allowedHeaders: ['content-type'] }),
    // Format 4: Array with all S3-like fields
    JSON.stringify([{
      allowedOrigins: ['https://portraitpayai.com'],
      allowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
      allowedHeaders: ['*'],
      allowedExposeHeaders: ['*'],
      maxAgeSeconds: 3600
    }])
  ];
  
  for (let i = 0; i < formats.length; i++) {
    console.log(`\nFormat ${i+1}:`, formats[i].substring(0, 100));
    const r = await api('PUT', `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`, formats[i]);
    console.log('Status:', r.status, r.body.substring(0, 200));
    if (r.status === 200) { console.log('✅ SUCCESS!'); break; }
  }
})();
