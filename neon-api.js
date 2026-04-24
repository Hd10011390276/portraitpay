const https = require('https');
const apiKey = 'napi_u8w8t768d1laycfdlqwj60hl5zmcadks8b3a8778um0uh7pnrkzj6muwe91xrvxy';

// Neon API base - try different hosts/paths
const endpoints = [
  ['console.neon.tech', '/api/v1/projects/flat-butterfly-70920766'],
  ['console.neon.tech', '/api/v1/projects'],
  ['api.neon.tech', '/api/v1/projects'],
];

function apiGet(host, path) {
  return new Promise((resolve) => {
    let data = '';
    const options = {
      hostname: host,
      path: path,
      headers: { 
        'Authorization': 'Bearer ' + apiKey, 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    const req = https.get(options, res => {
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data: data.substring(0, 400) }));
    });
    req.on('error', e => resolve({ status: -1, data: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ status: -2, data: 'timeout' }); });
  });
}

async function main() {
  for (const [host, path] of endpoints) {
    const r = await apiGet(host, path);
    console.log(`${host} ${path} => ${r.status}: ${r.data}`);
  }
}

main();
