const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const deployId = 'dpl_2bYdyZpwVssEyrerZU1UtbnEnDiN';

const options = {
  hostname: 'api.vercel.com',
  path: '/v13/deployments/' + deployId,
  headers: { Authorization: 'Bearer ' + token }
};
let data = '';
https.get(options, res => {
  res.on('data', d => data += d);
  res.on('end', () => {
    // Print full response
    console.log('Full response:');
    try { const j = JSON.parse(data); console.log(JSON.stringify(j, null, 2).substring(0, 2000)); }
    catch(e) { console.log(data.substring(0, 2000)); }
  });
}).on('error', e => console.log(e.message));
