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
    console.log('Logged in, creating portrait...');
    
    const postData = JSON.stringify({ title: 'Email Test v2', category: 'test' });
    const createReq = https.request({
      hostname: 'portraitpayai.com',
      path: '/api/portraits',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (createRes) => {
      let createBody = '';
      createRes.on('data', c => createBody += c);
      createRes.on('end', () => {
        console.log('Created:', createBody.slice(0, 200));
      });
    });
    createReq.end(postData);
  });
});

loginReq.on('error', e => console.error(e.message));
loginReq.end(loginData);