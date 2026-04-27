const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const tempDir = os.tmpdir();
  // SAME image for both - should return HIGH similarity (PASS)
  const img1 = path.join(tempDir, 'face_real1.jpg');
  const img2 = path.join(tempDir, 'face_real1.jpg'); // identical to img1

  console.log(`Testing with SAME image (${fs.statSync(img1).size} bytes)`);

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

  const hostname = 'portraitpay-qozj8cxlz-hd10011390276s-projects.vercel.app';
  const options = {
    hostname,
    path: '/api/face/compare',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    }
  };

  console.log(`POST to ${hostname}/api/face/compare...`);
  console.log('(Same image twice - should return HIGH similarity or PASS)');
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
    req.on('error', (e) => {
      console.error('Error:', e.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

main().catch(console.error);
