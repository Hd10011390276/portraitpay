const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const ids = ['dpl_DGeVTbxZD2WAmgvuLioNWdCYQtms', 'dpl_2rfZw24MXGdWRXuBn2gzNw5VxGeS', 'dpl_8LzP5AFNSrez6FBc2USYV1tLke8p'];
let done = 0;
ids.forEach(id => {
  let d = '';
  https.get({ hostname: 'api.vercel.com', path: '/v13/deployments/' + id, headers: { Authorization: 'Bearer ' + token } }, r => {
    r.on('data', c => d += c);
    r.on('end', () => {
      const j = JSON.parse(d);
      console.log(id.substring(0, 8), j.readyState, j.errorMessage || '');
      if (++done === 3) {
        // Now test lawyer page
        https.get({ hostname: 'portraitpayai.com', path: '/enterprise/lawyer-registration', timeout: 10000 }, res => {
          console.log('/enterprise/lawyer-registration', res.statusCode);
          process.exit(0);
        }).on('error', e => { console.log('ERR:', e.message); process.exit(1); });
      }
    });
  }).on('error', e => { console.log(id.substring(0, 8), 'ERR:', e.message); if (++done === 3) process.exit(1); });
});