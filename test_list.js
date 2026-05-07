const https = require('https');

const loginData = JSON.stringify({ email: '799096322@qq.com', password: 'Hd210011390276' });

const loginReq = https.request({
  hostname: 'portraitpayai.com',
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
}, (loginRes) => {
  let loginBody = '';
  loginRes.on('data', c => loginBody += c);
  loginRes.on('end', () => {
    const token = JSON.parse(loginBody).data?.accessToken;
    console.log('Logged in, token:', token ? token.slice(0, 20) + '...' : 'NONE');

    // List portraits
    const listReq = https.request({
      hostname: 'portraitpayai.com',
      path: '/api/portraits',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (listRes) => {
      let lb = '';
      listRes.on('data', c => lb += c);
      listRes.on('end', () => {
        const portraits = JSON.parse(lb).data || [];
        console.log('Portraits count:', portraits.length);
        portraits.forEach(p => console.log(' -', p.id, '|', p.status, '| hasHash:', !!p.portraitImageHash, '| tx:', p.blockchainTxHash || 'none'));
        process.exit(0);
      });
    });
    listReq.on('error', e => { console.error(e.message); process.exit(1); });
    listReq.end();
  });
});
loginReq.on('error', e => { console.error(e.message); process.exit(1); });
loginReq.end(loginData);