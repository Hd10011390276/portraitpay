const https = require('https');

// Test if Vercel Lambda can reach Neon
// Make a simple HTTP request to the Neon pooler health check
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

// First, let's check the current deployment's config
let d = '';
https.get({
  hostname: 'api.vercel.com',
  path: '/v13/deployments/dpl_Bo9vt1RSvJ9345JW1DJwANwB3KrN',
  headers: { Authorization: 'Bearer ' + token }
}, r => {
  r.on('data', c => d += c);
  r.on('end', () => {
    try {
      const j = JSON.parse(d);
      console.log('Deployment:', j.uid);
      console.log('State:', j.readyState);
      console.log('URL:', j.url);
      console.log('Created:', new Date(j.createdAt).toISOString());
      console.log('Target state:', j.targetState);
    } catch(e) {
      console.log('Parse error:', d.substring(0, 100));
    }
  });
}).on('error', e => console.log(e.message));
