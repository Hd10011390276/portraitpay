const https = require('https');

async function main() {
  const hostname = 'portraitpay-ip9zqtcpo-hd10011390276s-projects.vercel.app';
  const options = {
    hostname,
    path: '/api/face/compare?mode=debug',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': '2',
    }
  };

  console.log('Checking env vars on', hostname);
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', JSON.parse(data));
        resolve();
      });
    });
    req.on('error', (e) => { console.error('Error:', e.message); resolve(); });
    req.write('{}');
    req.end();
  });
}

main().catch(console.error);
