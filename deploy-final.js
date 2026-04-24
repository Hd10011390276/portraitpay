const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const authSecret = 'Ta8gZ2Q6WJ4X3m9K7hR5N2P8E1F4L7A0D3C6B9X2Y5M8N1Q4W7Z0A3B6';

const gitSource = { type: 'github', repo: 'Hd10011390276/portraitpay-frontend', ref: 'main', repoId: 1192767896 };
const body = {
  name: 'portraitpay-frontend',
  gitSource: gitSource,
  target: 'production',
  env: {
    'DATABASE_URL': dbUrl,
    'AUTH_SECRET': authSecret,
    'AUTH_URL': 'https://portraitpayai.com',
    'NEXTAUTH_URL': 'https://portraitpayai.com'
  }
};

const bodyStr = JSON.stringify(body);
const opts = {
  hostname: 'api.vercel.com',
  path: '/v13/deployments',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyStr)
  }
};

let data = '';
const req = https.request(opts, res => {
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode !== 200 && res.statusCode !== 201) {
      console.log('Error:', data.substring(0, 500));
    } else {
      const j = JSON.parse(data);
      console.log('Deploy ID:', j.id);
      console.log('State:', j.readyState);
      console.log('URL:', j.url);
      console.log('Commit:', j.meta?.githubCommitSha);
    }
  });
});
req.on('error', e => console.log('Request error:', e.message));
req.setTimeout(30000, () => { console.log('timeout'); req.destroy(); });
req.write(bodyStr);
req.end();