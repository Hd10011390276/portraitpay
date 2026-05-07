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
    
    // Get portrait detail
    const portraitId = 'cmov1ij850003um2ftmutojsa';
    const getReq = https.request({
      hostname: 'portraitpayai.com',
      path: '/api/portraits/' + portraitId,
      headers: { 'Authorization': 'Bearer ' + token }
    }, (getRes) => {
      let gb = '';
      getRes.on('data', c => gb += c);
      getRes.on('end', () => {
        const p = JSON.parse(gb).data;
        console.log('Portrait:', p.id);
        console.log('Status:', p.status);
        console.log('portraitImageHash:', p.portraitImageHash);
        console.log('idCardFrontHash:', p.idCardFrontHash);
        console.log('idCardType:', p.idCardType);
        console.log('idCardName:', p.idCardName);
        console.log('idCardNumber:', p.idCardNumber);
        process.exit(0);
      });
    });
    getReq.on('error', e => { console.error(e.message); process.exit(1); });
    getReq.end();
  });
});
loginReq.on('error', e => { console.error(e.message); process.exit(1); });
loginReq.end(loginData);