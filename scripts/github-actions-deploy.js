const https = require('https');

const VER_TOKEN = (process.env.VERCEL_TOKEN || '').replace(/[\n\r]/g, '');
const DB_URL = (process.env.DATABASE_URL || '').replace(/[\n\r]/g, '');
const DIRECT_URL = (process.env.DIRECT_URL || '').replace(/[\n\r]/g, '');

const SHA = require('child_process').execSync('git rev-parse HEAD').toString().trim();

// Build env object
const env = {};
if (DB_URL) env.DATABASE_URL = DB_URL;
if (DIRECT_URL) env.DIRECT_URL = DIRECT_URL;

const payload = JSON.stringify({
  name: 'portraitpay',
  gitSource: {
    type: 'github',
    repo: 'Hd10011390276/portraitpay',
    repoId: 1196064714,
    ref: 'main',
    sha: SHA
  },
  buildCommand: 'npm run build',
  outputDirectory: '.next',
  runtime: 'nodejs20',
  env
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

console.log('Creating deployment...');
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Deploy status:', res.statusCode);
    const parsed = JSON.parse(data);
    if (parsed.id) {
      console.log('✅ Deployment created:', parsed.id);
      console.log('URL: https://' + parsed.url);
      pollDeployment(parsed.id);
    } else if (parsed.error) {
      console.error('❌ Failed:', parsed.error.code, parsed.error.message);
      process.exit(1);
    } else {
      console.log('❌ Failed:', JSON.stringify(parsed));
      process.exit(1);
    }
  });
});

function pollDeployment(id) {
  const check = https.request({
    hostname: 'api.vercel.com',
    path: '/v13/deployments/' + id,
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + VER_TOKEN }
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const d = JSON.parse(data);
      if (d.readyState === 'READY') {
        console.log('✅ Deployment READY: https://' + d.url);
      } else if (d.readyState === 'ERROR' || d.readyState === 'CANCELED') {
        console.error('❌ Deployment state:', d.readyState, d.errorMessage);
        process.exit(1);
      } else {
        console.log('Status:', d.readyState, '...waiting');
        setTimeout(() => pollDeployment(id), 8000);
      }
    });
  });
  check.end();
}

req.on('error', (e) => { console.error('Request error:', e.message); process.exit(1); });
req.write(payload);
req.end();