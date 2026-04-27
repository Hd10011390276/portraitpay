const https = require('https');

// Test debug mode against latest deployment
const hostname = 'portraitpay-hhojm5fr0-hd10011390276s-projects.vercel.app';
const options = {
  hostname,
  path: '/api/face/compare?mode=debug',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': 2,
  }
};

console.log('Testing env status on', hostname);
return new Promise((resolve) => {
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data.substring(0, 500));
      resolve();
    });
  });
  req.on('error', (e) => { console.error('Error:', e.message); resolve(); });
  req.write('{}');
  req.end();
});
