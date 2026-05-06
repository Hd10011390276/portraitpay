const https = require('https');

const VER_TOKEN = process.env.VERCEL_TOKEN;
const DB_URL = process.env.DATABASE_URL || '';
const DIRECT_URL = process.env.DIRECT_URL || '';

const payload = JSON.stringify({
  name: 'portraitpay',
  gitSource: {
    type: 'github',
    repo: 'Hd10011390276/portraitpay',
    ref: 'main',
    sha: require('child_process').execSync('git rev-parse HEAD').toString().trim()
  },
  buildCommand: 'npm run build',
  outputDirectory: '.next',
  runtime: 'nodejs20',
  env: [
    { key: 'DATABASE_URL', value: DB_URL, type: 'encrypted' },
    { key: 'DIRECT_URL', value: DIRECT_URL, type: 'encrypted' }
  ]
});

const options = {
  hostname: 'api.vercel.com',
  path: '/v13/deployments',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + VER_TOKEN,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Deploy status:', res.statusCode);
    const parsed = JSON.parse(data);
    if (parsed.url) {
      console.log('✅ Deployment: https://' + parsed.url);
    } else {
      console.log('❌ Failed:', JSON.stringify(parsed, null, 2));
      process.exit(1);
    }
  });
});

req.on('error', (e) => { console.error('Request error:', e.message); process.exit(1); });
req.write(payload);
req.end();