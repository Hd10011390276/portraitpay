const https = require('https');

const ACCOUNT_ID = 'b0d0ec3c3f9bc0e681ded21e2126bab2';
const API_TOKEN = 'cfat_OEsxqF2iJzOfTY8iAaxLxgWfKV4LEgmFZwoFQwQE78684cc9';
const BUCKET_NAME = 'portraitpay-uploads';

// Try PUT with minimal valid body
const body = JSON.stringify([
  {
    allowedOrigins: ['https://portraitpayai.com'],
    allowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
    allowedHeaders: ['content-type', 'authorization']
  }
]);

console.log('Body:', body);
console.log('Body length:', Buffer.byteLength(body));

// First try GET
const getOpts = {
  hostname: 'api.cloudflare.com',
  path: `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`,
  method: 'GET',
  headers: { 'Authorization': 'Bearer ' + API_TOKEN }
};
https.request(getOpts, res => {
  let d = ''; res.on('data', c => d += c); res.on('end', () => {
    console.log('GET status:', res.statusCode, d.substring(0, 200));
    
    // Now PUT
    const putOpts = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`,
      method: 'PUT',
      headers: { 
        'Authorization': 'Bearer ' + API_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const putReq = https.request(putOpts, putRes => {
      let pd = ''; putRes.on('data', c => pd += c); putRes.on('end', () => {
        console.log('PUT status:', putRes.statusCode, pd.substring(0, 500));
      });
    });
    putReq.on('error', e => console.log('PUT ERR:', e.message));
    putReq.write(body); putReq.end();
  });
}).on('error', e => console.log('GET ERR:', e.message)).end();
