const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file).on('finish', resolve).on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const tempDir = os.tmpdir();
  const img1 = path.join(tempDir, 'face_t1.jpg');
  const img2 = path.join(tempDir, 'face_t2.jpg');

  // Download unique test images
  console.log('Downloading test images...');
  await Promise.all([
    downloadFile('https://httpbin.org/image/jpeg?x=' + Date.now(), img1),
    downloadFile('https://httpbin.org/image/jpeg?y=' + Date.now(), img2),
  ]);
  console.log(`Images: ${fs.statSync(img1).size}, ${fs.statSync(img2).size} bytes`);

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

  // Test against new deployment
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
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data.substring(0, 800));
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
