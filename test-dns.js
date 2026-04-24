const https = require('https');
const tls = require('tls');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

// Test if we can resolve and connect to the Neon hostname
const hostname = 'ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech';
const port = 5432;

console.log('Testing DNS resolution...');
try {
  const dns = require('dns');
  dns.lookup(hostname, (err, address) => {
    if (err) {
      console.log('❌ DNS lookup failed:', err.message);
    } else {
      console.log('✅ DNS resolved to:', address);
    }
  });
} catch (e) {
  console.log('DNS module error:', e.message);
}

// Test HTTPS connectivity to Vercel API
console.log('\nTesting Vercel API...');
let d = '';
https.get({
  hostname: 'api.vercel.com',
  path: '/v13/projects/portraitpay/env?teamId=hd10011390276s-projects',
  headers: { Authorization: 'Bearer ' + token }
}, r => {
  r.on('data', c => d += c);
  r.on('end', () => {
    try {
      const j = JSON.parse(d);
      const db = j.envs?.find(e => e.key === 'DATABASE_URL');
      console.log('DATABASE_URL found:', !!db);
      console.log('DATABASE_URL id:', db?.id);
      console.log('DATABASE_URL createdAt:', new Date(db?.createdAt).toISOString());
    } catch (e) {
      console.log('Parse error:', d.substring(0, 100));
    }
  });
}).on('error', e => console.log('API error:', e.message));
