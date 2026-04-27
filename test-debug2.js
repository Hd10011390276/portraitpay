const https = require('https');

async function main() {
  const hostname = 'portraitpay-hhojm5fr0-hd10011390276s-projects.vercel.app';
  const boundary = '----DebugBoundary' + Date.now();

  // Send empty multipart with debug param
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="debug"\r\n\r\n1\r\n`),
    Buffer.from(`--${boundary}--\r\n`),
  ]);

  const options = {
    hostname,
    path: '/api/face/compare?debug=1',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    }
  };

  console.log('GET env status via POST with debug=1...');
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
    req.write(body);
    req.end();
  });
}

main().catch(console.error);
