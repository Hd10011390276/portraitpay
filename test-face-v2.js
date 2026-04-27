const http = require('http');
const https = require('https');
const fs = require('fs');
const { pipeline } = require('stream/promises');

const tempDir = require('os').tmpdir();

async function downloadFile(url, dest) {
  const file = fs.createWriteStream(dest);
  const httpMod = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    httpMod.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      pipeline(response, file).then(() => resolve()).catch(reject);
    }).on('error', reject);
  });
}

async function main() {
  const img1 = path.join(tempDir, 'face_test1.jpg');
  const img2 = path.join(tempDir, 'face_test2.jpg');

  console.log('Downloading test images...');
  await Promise.all([
    downloadFile('https://httpbin.org/image/jpeg', img1),
    downloadFile('https://httpbin.org/image/jpeg', img2),
  ]);
  console.log('Downloaded OK');

  const boundary = '----WebKitBoundary' + Date.now();
  const file1Data = fs.readFileSync(img1);
  const file2Data = fs.readFileSync(img2);

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="image1"; filename="portrait.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    file1Data,
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="image2"; filename="idcard.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    file2Data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const options = {
    hostname: 'portraitpay-git-main-hd10011390276s-projects.vercel.app',
    path: '/api/face/compare',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    }
  };

  console.log('Testing face compare API...');
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data.substring(0, 800));
        resolve();
      });
    });
    req.on('error', (e) => {
      console.error('Network error:', e.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

const path = require('path');
main().catch(console.error);
