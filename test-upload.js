const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// This script tests the R2 upload by using a special test endpoint
// that tries to upload a tiny test file and returns the result

async function main() {
  const tempDir = os.tmpdir();
  const img1 = path.join(tempDir, 'face_real1.jpg');
  const img2 = path.join(tempDir, 'face_real1.jpg');
  const fileData = fs.readFileSync(img1);

  const boundary = '----WebKitBoundary' + Date.now();
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image1"; filename="portrait.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    fileData,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="image2"; filename="idcard.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    fileData,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  // Test on production domain
  const hostname = 'portraitpayai.com';
  const options = {
    hostname,
    path: '/api/face/compare',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    }
  };

  console.log('Testing face compare on portraitpayai.com...');
  console.log('(Same real face image - should return HIGH similarity/PASS)');
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('\n=== RESULT ===');
          console.log('provider:', parsed.provider);
          console.log('score:', parsed.score);
          console.log('result:', parsed.result);
          if (parsed.error) console.log('error:', parsed.error);
          if (parsed._debug) console.log('Aliyun raw:', JSON.stringify(parsed._debug));
          console.log('=============\n');
        } catch (e) {
          console.log('Non-JSON response:', data.substring(0, 200));
        }
        resolve();
      });
    });
    req.on('error', (e) => { console.error('Error:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

main().catch(console.error);
