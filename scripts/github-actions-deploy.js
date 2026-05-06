const https = require('https');

const VER_TOKEN = (process.env.VERCEL_TOKEN || '').replace(/[\n\r]/g, '');
const DB_URL = (process.env.DATABASE_URL || '').replace(/[\n\r\t\x00]/g, '').trim();
const DIRECT_URL = (process.env.DIRECT_URL || '').replace(/[\n\r\t\x00]/g, '').trim();

if (!DB_URL) {
  console.error('DATABASE_URL is empty — check GitHub Actions secrets');
  process.exit(1);
}
if (!DIRECT_URL) {
  console.error('DIRECT_URL is empty — check GitHub Actions secrets');
  process.exit(1);
}

const SHA = require('child_process').execSync('git rev-parse HEAD').toString().trim();

const payload = JSON.stringify({
  name: 'portraitpay',
  projectId: 'prj_6FYHbjqW3UebcAxGAwuIk0wXcVpr',
  target: 'production',
  gitSource: {
    type: 'github',
    repoId: 1196064714,
    ref: 'main',
    sha: SHA
  },
  buildCommand: 'npm run build',
  outputDirectory: '.next',
  runtime: 'nodejs20',
  env: {
    DATABASE_URL: DB_URL,
    DIRECT_URL: DIRECT_URL
  }
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
    if (parsed.id) {
      console.log('Deployment created:', parsed.id);
      checkDeployment(parsed.id);
    } else if (parsed.error) {
      console.error('Failed:', parsed.error.code, parsed.error.message);
      process.exit(1);
    } else {
      console.error('Failed:', JSON.stringify(parsed));
      process.exit(1);
    }
  });
});

function checkDeployment(id) {
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
      if (d.readyState === 'READY' || d.readyState === 'ERROR') {
        console.log('Final state:', d.readyState, d.url || d.errorMessage);
        if (d.readyState === 'ERROR') process.exit(1);
      } else {
        setTimeout(() => checkDeployment(id), 8000);
      }
    });
  });
  check.end();
}

req.on('error', (e) => { console.error('Request error:', e.message); process.exit(1); });
req.write(payload);
req.end();