const https = require('https');

const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const dbValue = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';

// First verify the value
console.log('Adding DATABASE_URL:', dbValue.substring(0, 50) + '...');

const body = JSON.stringify({
  key: 'DATABASE_URL',
  value: dbValue,
  target: ['production'],
  type: 'encrypted'
});

let data = '';
const req = https.request({
  hostname: 'api.vercel.com',
  path: '/v13/projects/portraitpay/env',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, res => {
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      if (j.error) {
        console.log('Error:', j.error.message);
      } else {
        console.log('Success! Created:', j.created?.id);
        console.log('Key:', j.created?.key);
        console.log('Created at:', new Date(j.created?.createdAt).toISOString());
      }
    } catch (e) {
      console.log('Parse error:', data.substring(0, 200));
    }
    process.exit(0);
  });
});

req.on('error', e => {
  console.log('Request error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
