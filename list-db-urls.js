const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

let d = '';
const req = https.request({
  hostname: 'api.vercel.com',
  path: '/v13/projects/portraitpay/env?teamId=hd10011390276s-projects',
  headers: { Authorization: 'Bearer ' + token }
}, res => {
  res.on('data', c => d += c);
  res.on('end', () => {
    const j = JSON.parse(d);
    console.log('Total env vars:', j.envs?.length);
    const dbUrls = j.envs?.filter(e => e.key === 'DATABASE_URL');
    console.log('DATABASE_URL entries:', dbUrls?.length);
    dbUrls?.forEach((e, i) => {
      console.log(`\nEntry ${i}:`);
      console.log('  id:', e.id);
      console.log('  createdAt:', new Date(e.createdAt).toISOString());
      console.log('  updatedAt:', new Date(e.updatedAt).toISOString());
      console.log('  target:', JSON.stringify(e.target));
    });
    
    // Check other postgresql-related envs
    console.log('\n--- All env vars ---');
    j.envs?.forEach(e => {
      const preview = e.value?.substring(0, 20) || '[empty]';
      console.log(`  ${e.key}: ${preview}... (target: ${JSON.stringify(e.target)})`);
    });
  });
});
req.on('error', e => console.log(e.message));
req.end();
