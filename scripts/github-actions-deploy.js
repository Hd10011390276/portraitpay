const https = require('https');
const { execSync } = require('child_process');

const VER_TOKEN = (process.env.VERCEL_TOKEN || '').replace(/[\n\r]/g, '');
const DB_URL = (process.env.DATABASE_URL || '').replace(/[\n\r]/g, '');
const DIRECT_URL = (process.env.DIRECT_URL || '').replace(/[\n\r]/g, '');
const SHA = execSync('git rev-parse HEAD').toString().trim();

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
  env
});

function deployWithApi(callback) {
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
      const parsed = JSON.parse(data);
      if (parsed.id) {
        console.log('✅ Deployment created via API:', parsed.id);
        pollDeployment(parsed.id);
      } else if (parsed.error && parsed.error.message && parsed.error.message.includes('api-deployments-free-per-day')) {
        console.log('⚠️ API rate limited — falling back to CLI...');
        deployWithCli(callback);
      } else if (parsed.error) {
        console.error('❌ API error:', parsed.error.code, parsed.error.message);
        process.exit(1);
      } else {
        console.error('❌ Unknown API response:', JSON.stringify(parsed));
        process.exit(1);
      }
    });
  });
  req.on('error', (e) => { console.error('API request error:', e.message); process.exit(1); });
  req.write(payload);
  req.end();
}

function deployWithCli(callback) {
  console.log('Trying Vercel CLI...');
  try {
    const output = execSync('vercel --prod --yes --token ' + VER_TOKEN, { encoding: 'utf8' });
    console.log('✅ CLI deploy succeeded');
    console.log(output.substring(0, 500));
  } catch (err) {
    const output = err.stdout || '';
    if (output.includes('api-deployments-free-per-day')) {
      console.error('❌ Both API and CLI rate limited. Please wait 24h and retry.');
    } else {
      console.error('❌ CLI deploy failed:', output.substring(0, 500));
    }
    process.exit(1);
  }
}

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

console.log('Starting deployment via Vercel CLI...');
deployWithCli();