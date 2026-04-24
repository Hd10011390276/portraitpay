const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
let d = '';
https.get({
  hostname: 'api.vercel.com',
  path: '/v13/deployments?teamId=hd10011390276s-projects&limit=5',
  headers: { Authorization: 'Bearer ' + token }
}, r => {
  r.on('data', c => d += c);
  r.on('end', () => {
    try {
      const j = JSON.parse(d);
      if (j.deployments) {
        j.deployments.forEach(d => console.log(d.uid.substring(0, 12), d.readyState, d.url || d.metadata?.alias || '', new Date(d.createdAt).toLocaleTimeString()));
      } else {
        console.log('No deployments:', d.substring(0, 200));
      }
    } catch (e) {
      console.log('Parse error:', d.substring(0, 200));
    }
  });
}).on('error', e => console.log(e.message));
