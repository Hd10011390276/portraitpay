const https = require('https');
const token = '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';

function api(path) {
  return new Promise((resolve) => {
    let data = '';
    const options = {
      hostname: 'api.github.com',
      path: path,
      headers: { 
        'Authorization': 'Bearer ' + token, 
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PortraitPay-Agent/1.0'
      }
    };
    const req = https.get(options, res => {
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data: data }));
    });
    req.on('error', e => resolve({ status: -1, data: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: -2, data: 'timeout' }); });
  });
}

async function main() {
  const r = await api('/repos/Hd10011390276/portraitpay-frontend');
  if (r.status === 200) {
    const j = JSON.parse(r.data);
    console.log('portraitpay-frontend repo ID:', j.id);
  } else {
    console.log('Error:', r.status, r.data.substring(0, 200));
  }
}

main();
