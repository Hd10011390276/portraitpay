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
    const portraitId = 'cmov00ity0001704yxpjoagji';

    // Get portrait detail
    const getReq = https.request({
      hostname: 'portraitpayai.com',
      path: '/api/portraits/' + portraitId,
      headers: { 'Authorization': 'Bearer ' + token }
    }, (getRes) => {
      let gb = '';
      getRes.on('data', c => gb += c);
      getRes.on('end', () => {
        const p = JSON.parse(gb).data;
        console.log('Portrait:', JSON.stringify(p, null, 2));
        process.exit(0);
      });
    });
    getReq.on('error', e => { console.error(e.message); process.exit(1); });
    getReq.end();
  });
});
loginReq.on('error', e => { console.error(e.message); process.exit(1); });
loginReq.end(loginData);