const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const tempDir = os.tmpdir();
  // Test 1: Same image (should be PASS or high similarity)
  const imgSame = path.join(tempDir, 'face_real1.jpg');
  // Test 2: Two different faces (should be FAIL or low similarity)
  const imgDiff = path.join(tempDir, 'face_real2.jpg');

  const boundary = '----WebKitBoundary' + Date.now();
  const fileSame = fs.readFileSync(imgSame);
  const fileDiff = fs.readFileSync(imgDiff);

  // TEST 1: Same image
  const body1 = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image1"; filename="portrait.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    fileSame,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="image2"; filename="idcard.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    fileSame, // same file
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  // TEST 2: Different images
  const body2 = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image1"; filename="portrait.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    fileSame,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="image2"; filename="idcard.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    fileDiff,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const hostname = 'portraitpayai.com';

  async function postTest(body, label) {
    return new Promise((resolve) => {
      const options = {
        hostname,
        path: '/api/face/compare',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          console.log(`${label}: provider=${parsed.provider} score=${parsed.score} result=${parsed.result}`);
          if (parsed._debug) console.log(`  Aliyun raw:`, JSON.stringify(parsed._debug));
          resolve();
        });
      });
      req.on('error', (e) => { console.error('Error:', e.message); resolve(); });
      req.write(body);
      req.end();
    });
  }

  console.log('=== Face Compare Test on portraitpayai.com ===');
  await postTest(body1, 'SAME image ');
  await postTest(body2, 'DIFF image');
}

main().catch(console.error);
