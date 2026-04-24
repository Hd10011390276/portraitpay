const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

function api(path) {
  return new Promise(resolve => {
    let data = '';
    const opts = { hostname: 'api.vercel.com', path, headers: { Authorization: 'Bearer ' + token } };
    const req = https.get(opts, res => { res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, data: data })); });
    req.on('error', e => resolve({ status: -1, data: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: -2, data: 'timeout' }); });
  });
}

async function main() {
  // Check portraitpay project envs
  const list1 = await api('/v6/projects/portraitpay/env?decrypt=true');
  console.log('portraitpay envs:', list1.status);
  if (list1.status === 200) {
    const j = JSON.parse(list1.data);
    console.log('  Count:', j.envs?.length || j.env?.length || 0);
    const envs = j.envs || j.env || [];
    envs.forEach(e => console.log(' ', e.key, '=', e.value?.substring(0, 15) + '...', '| type:', e.type));
  }
  
  // Check portraitpay-frontend project envs
  const list2 = await api('/v6/projects/portraitpay-frontend/env?decrypt=true');
  console.log('portraitpay-frontend envs:', list2.status);
  if (list2.status === 200) {
    const j = JSON.parse(list2.data);
    console.log('  Count:', j.envs?.length || j.env?.length || 0);
    const envs = j.envs || j.env || [];
    envs.forEach(e => console.log(' ', e.key, '=', e.value?.substring(0, 15) + '...', '| type:', e.type));
  }
}

main().catch(e => console.log(e.message));