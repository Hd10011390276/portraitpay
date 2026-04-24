const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const deployId = 'dpl_GzBfitXfLGAsKUzzeo3GZ8uh8phK';

const options = {
  hostname: 'api.vercel.com',
  path: '/v2/deployments/' + deployId + '/events',
  headers: { Authorization: 'Bearer ' + token }
};
let data = '';
https.get(options, res => {
  res.on('data', d => data += d);
  res.on('end', () => {
    const events = JSON.parse(data);
    // Find stderr events that look like errors
    events.forEach(e => {
      if (e.type === 'stderr' || e.type === 'stdout') {
        const text = e.payload?.text || '';
        if (text.includes('Error') || text.includes('error') || text.includes('Failed') || text.includes('failed') || text.includes('ENOENT') || text.includes('SyntaxError') || text.includes('Error:')) {
          console.log('[' + new Date(e.created).toISOString() + ']', text.substring(0, 300));
        }
      }
    });
  });
}).on('error', e => console.log(e.message));
