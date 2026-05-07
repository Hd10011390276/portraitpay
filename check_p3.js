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
    console.log('Token OK');
    
    // Get portrait CMOV2XF6M0005SA119YMLDYD5
    const portraitId = 'cmov2xf6m0005sa119ymldyd5';
    const getReq = https.request({
      hostname: 'portraitpayai.com',
      path: '/api/portraits/' + portraitId,
      headers: { 'Authorization': 'Bearer ' + token }
    }, (getRes) => {
      let gb = '';
      getRes.on('data', c => gb += c);
      getRes.on('end', () => {
        const p = JSON.parse(gb).data;
        console.log('Portrait ID:', p?.id);
        console.log('Hash:', p?.portraitImageHash);
        console.log('ID Hash:', p?.idCardFrontHash);
        console.log('Type:', p?.idCardType);
        console.log('Name:', p?.idCardName);
        console.log('Number:', p?.idCardNumber);
        process.exit(0);
      });
    });
    getReq.on('error', e => { console.error(e.message); process.exit(1); });
    getReq.end();
  });
});
loginReq.on('error', e => { console.error(e.message); process.exit(1); });
loginReq.end(loginData);