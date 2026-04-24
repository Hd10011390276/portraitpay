const https = require('https');

const ACCOUNT_ID = 'b0d0ec3c3f9bc0e681ded21e2126bab2';
const API_TOKEN = 'cfat_OEsxqF2iJzOfTY8iAaxLxgWfKV4LEgmFZwoFQwQE78684cc9';
const BUCKET_NAME = 'portraitpay-uploads';

const corsBody = JSON.stringify([
  {
    AllowedOrigins: ['https://portraitpayai.com'],
    AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
    AllowedHeaders: ['Content-Type', 'Authorization']
  }
]);

console.log('Sending CORS config:', corsBody);
console.log('Length:', corsBody.length);

const options = {
  hostname: 'api.cloudflare.com',
  path: `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`,
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + API_TOKEN,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(corsBody);
req.end();
