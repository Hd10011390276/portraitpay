const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const id = 'dpl_CDoqugFn8CfbeBTV3UYGJbGzSCy6';

function check() {
  let data = '';
  https.get({
    hostname: 'api.vercel.com', 
    path: '/v13/deployments/' + id,
    headers: { Authorization: 'Bearer ' + token }
  }, res => {
    res.on('data', c => data += c);
    res.on('end', () => {
      const j = JSON.parse(data);
      const state = j.readyState;
      console.log(new Date().toISOString(), '|', state, '|', j.url, '|', j.errorMessage || '');
      if (state === 'READY') {
        console.log('\n✅ DEPLOY SUCCEEDED! portraitpayai.com should work now.');
        process.exit(0);
      } else if (state === 'ERROR') {
        console.log('\n❌ DEPLOY FAILED:', j.errorMessage);
        process.exit(1);
      } else {
        setTimeout(check, 15000);
      }
    });
  }).on('error', e => { console.log('Error:', e.message); setTimeout(check, 15000); });
}

check();