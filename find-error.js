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
    // Find the actual error - look for "SyntaxError" or unterminated string
    events.forEach(e => {
      if (e.type === 'stderr') {
        const text = e.payload?.text || '';
        if (text.includes('SyntaxError') || text.includes('Unterminated') || text.includes('translations.ts')) {
          console.log('[' + new Date(e.created).toISOString() + ']', text.substring(0, 500));
        }
      }
    });
    
    // Also print the last few events before error
    const errorIdx = events.findIndex(e => e.payload?.text?.includes('Syntax Error'));
    if (errorIdx > 0) {
      console.log('\n--- Events around syntax error ---');
      for (let i = Math.max(0, errorIdx - 5); i < Math.min(events.length, errorIdx + 3); i++) {
        console.log(events[i].type, ':', events[i].payload?.text?.substring(0, 200));
      }
    }
  });
}).on('error', e => console.log(e.message));
