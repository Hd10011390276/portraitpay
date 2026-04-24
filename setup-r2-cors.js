const https = require('https');

const ACCOUNT_ID = 'b0d0ec3c3f9bc0e681ded21e2126bab2';
const API_TOKEN = 'cfat_OEsxqF2iJzOfTY8iAaxLxgWfKV4LEgmFZwoFQwQE78684cc9';
const BUCKET_NAME = 'portraitpay-uploads';

const corsRule = {
  "maxAgeSeconds": 3600,
  "allowedOrigins": ["https://portraitpayai.com", "http://localhost:3000"],
  "allowedMethods": ["GET", "POST", "PUT", "HEAD"],
  "allowedHeaders": ["Content-Type", "Content-MD5", "X-Amz-Content-Sha256", "X-Amz-Date", "Authorization"],
};

const body = JSON.stringify({
  "allowedOrigins": ["https://portraitpayai.com"],
  "allowedMethods": ["GET", "POST", "PUT", "HEAD"],
  "allowedHeaders": ["Content-Type", "Authorization"]
});

const options = {
  hostname: 'api.cloudflare.com',
  path: `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`,
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + API_TOKEN,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('Configuring CORS on R2 bucket...');
const req = https.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const j = JSON.parse(data);
    if (j.success) {
      console.log('✅ CORS configured successfully!');
      console.log('Allowed origins:', j.result.cors[0].allowedOrigins);
    } else {
      console.log('❌ CORS config failed:', JSON.stringify(j.errors));
    }
  });
});
req.on('error', e => console.log('❌ Error:', e.message));
req.write(body);
req.end();
