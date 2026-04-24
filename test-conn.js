const https = require('https');

// Make a request to the login endpoint and capture the full error
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

// First check current deployments
let d = '';
https.get({
  hostname: 'api.vercel.com',
  path: '/v13/deployments?teamId=hd10011390276s-projects&limit=3',
  headers: { Authorization: 'Bearer ' + token }
}, r => {
  r.on('data', c => d += c);
  r.on('end', () => {
    try {
      const j = JSON.parse(d);
      if (j.deployments) {
        j.deployments.forEach(dp => {
          console.log(dp.uid.substring(0, 12), dp.readyState, dp.url || dp.metadata?.alias || '(no url)', new Date(dp.createdAt).toISOString());
        });
      } else {
        console.log('Response:', d.substring(0, 200));
      }
    } catch(e) {
      console.log('Parse error:', d.substring(0, 200));
    }
  });
}).on('error', e => console.log(e.message));
