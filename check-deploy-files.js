const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const deployId = 'dpl_GzBfitXfLGAsKUzzeo3GZ8uh8phK';

// Try to download deployment file list
const options = {
  hostname: 'api.vercel.com',
  path: '/v2/deployments/' + deployId + '/files',
  headers: { Authorization: 'Bearer ' + token }
};
let data = '';
https.get(options, res => {
  res.on('data', d => data += d);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      // Find translations.ts in the file list
      if (j.files) {
        const t = j.files.find(f => f.name === 'translations.ts');
        console.log('translations.ts in deployment:', t ? 'Found, digest: ' + t.digest : 'NOT FOUND');
      }
      console.log('Response keys:', Object.keys(j));
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Response:', data.substring(0, 500));
    }
  });
}).on('error', e => console.log(e.message));
