const http = require('http');
const https = require('https');
const fs = require('fs');
const { pipeline } = require('stream/promises');

async function downloadFile(url, dest) {
  const file = fs.createWriteStream(dest);
  const httpMod = url.startsWith('https') ? https : http;
  await new Promise((resolve, reject) => {
    httpMod.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      pipeline(response, file).then(resolve).catch(reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading test images...');
  await downloadFile('https://httpbin.org/image/jpeg', 'C:\\temp\\test-face1.jpg');
  await downloadFile('https://httpbin.org/image/png', 'C:\\temp\\test-face2.jpg');
  console.log('Downloaded');

  const boundary = '----FormBoundary' + Date.now();
  const file1Data = fs.readFileSync('C:\\temp\\test-face1.jpg');
  const file2Data = fs.readFileSync('C:\\temp\\test-face2.jpg');

  const part1 = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="image1"; filename="portrait.jpg"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n`
  );
  const part2 = Buffer.from('\r\n');
  const part3 = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="image2"; filename="idcard.jpg"\r\n` +
    `Content-Type: image/png\r\n\r\n`
  );
  const part4 = Buffer.from(`\r\n--${boundary}--\r\n`);

  const body = Buffer.concat([part1, file1Data, part2, part3, file2Data, part4]);

  const options = {
    hostname: 'portraitpay-git-main-hd10011390276s-projects.vercel.app',
    path: '/api/face/compare',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    }
  };

  console.log('Calling face compare API...');
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data.substring(0, 500));
    });
  });
  req.on('error', (e) => console.error('Error:', e.message));
  req.write(body);
  req.end();
}

main().catch(console.error);
