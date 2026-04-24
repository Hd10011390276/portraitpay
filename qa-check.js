const https = require('https');

function check(path, expectedStatus = 200) {
  return new Promise(resolve => {
    let data = '';
    const req = https.get({
      hostname: 'portraitpayai.com',
      path,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
    }, res => {
      res.on('data', c => data += c);
      res.on('end', () => {
        const status = res.statusCode;
        const ok = status === expectedStatus ? '✅' : status >= 300 && status < 400 ? '➡️' : '❌';
        console.log(ok, path, '→', status, status === expectedStatus ? '' : '(expected ' + expectedStatus + ')');
        if (status === 302) console.log('   → redirects to:', res.headers.location);
        resolve({ path, status, expectedStatus });
      });
    });
    req.on('error', e => { console.log('❌', path, '→ ERR:', e.message); resolve({ path, error: e.message }); });
  });
}

async function main() {
  console.log('=== Public Pages ===');
  await check('/');
  await check('/login');
  await check('/register');
  await check('/forgot-password');
  await check('/terms');
  await check('/privacy');
  
  console.log('\n=== Auth-Protected Pages (expect 302 redirect to /login) ===');
  await check('/dashboard', 302);
  await check('/portraits/upload', 302);
  await check('/portraits', 302);
  await check('/earnings', 302);
  await check('/settings', 302);
  
  console.log('\n=== API Health ===');
  await check('/api/health');
}
main();