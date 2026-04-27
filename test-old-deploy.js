const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const tempDir = os.tmpdir();
  const img1 = path.join(tempDir, 'face_real1.jpg');
  const img2 = path.join(tempDir, 'face_real1.jpg'); // same

  const boundary = '----WebKitBoundary' + Date.now();
  const file1Data = fs.readFileSync(img1);
  const file2Data = fs.readFileSync(img2);

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image1"; filename="portrait.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    file1Data,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="image2"; filename="idcard.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    file2Data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  // Test against OLD deployment URL (portraitpay-cd9tc3l0c)
  const hostname = 'portraitpay-cd9tc3l0c-hd10011390276s-projects.vercel.app';
  const options = {
    hostname,
    path: '/api/face/compare',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    }
  };

  console.log(`Testing OLD deployment ${hostname}...`);
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        console.log('provider:', parsed.provider, '| score:', parsed.score, '| result:', parsed.result);
        if (parsed._debug) console.log('Aliyun raw:', JSON.stringify(parsed._debug));
        resolve();
      });
    });
    req.on('error', (e) => { console.error('Error:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

main().catch(console.error);
