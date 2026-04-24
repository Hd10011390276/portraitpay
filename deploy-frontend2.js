const https = require('https');
const crypto = require('crypto');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const authSecret = crypto.randomBytes(32).toString('base64');

function api(method, path, body) {
  return new Promise((resolve) => {
    let data = '';
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };
    if (body) {
      const bs = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bs);
    }
    const req = https.request(options, res => {
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data: data }));
    });
    req.on('error', e => resolve({ status: -1, data: e.message }));
    req.setTimeout(20000, () => { req.destroy(); resolve({ status: -2, data: 'timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Deploy portraitpay-frontend WITHOUT specifying sha - let Vercel use latest
  console.log('Triggering portraitpay-frontend deployment (no sha specified)...');
  const deploy = await api('POST', '/v13/deployments', {
    name: 'portraitpay-frontend',
    gitSource: { type: 'github', repo: 'Hd10011390276/portraitpay-frontend', ref: 'main' },
    target: 'production',
    env: {
      'DATABASE_URL': dbUrl,
      'AUTH_SECRET': authSecret,
      'AUTH_URL': 'https://portraitpayai.com',
      'NEXTAUTH_URL': 'https://portraitpayai.com'
    }
  });
  console.log('Deploy status:', deploy.status);
  
  if (deploy.status === 200 || deploy.status === 201) {
    const idMatch = deploy.data.match(/"id":"(dpl_[^"]+)"/);
    const stateMatch = deploy.data.match(/"readyState":"([^"]+)"/);
    const deployId = idMatch ? idMatch[1] : null;
    const state = stateMatch ? stateMatch[1] : 'BUILDING';
    const shaMatch = deploy.data.match('"sha":"([^"]+)"');
    
    console.log('Deploy ID:', deployId);
    console.log('State:', state);
    console.log('Commit SHA used:', shaMatch ? shaMatch[1] : 'unknown');
    
    if (deployId) {
      console.log('\nWaiting for deploy to complete...');
      
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 10000));
        
        const check = await api('GET', '/v13/deployments/' + deployId);
        if (check.status === 200) {
          const sMatch = check.data.match(/"readyState":"([^"]+)"/);
          const urlM = check.data.match(/"url":"([^"]+)"/);
          const shaM = check.data.match(/"sha":"([^"]+)"/);
          const errM = check.data.match(/"errorMessage":"([^"]+)"/);
          const curState = sMatch ? sMatch[1] : '?';
          const url = urlM ? urlM[1] : '';
          
          console.log('[' + (i+1) + '] State:', curState, '| Commit:', shaM ? shaM[1].substring(0,7) : '?', '| URL:', url);
          
          if (curState === 'READY') {
            console.log('\n✅ Deploy SUCCEEDED!');
            process.exit(0);
          } else if (curState === 'ERROR') {
            console.log('\n❌ Deploy FAILED:', errM ? errM[1] : 'unknown');
            process.exit(1);
          }
        }
      }
    }
  } else {
    console.log('Deploy request failed:', deploy.data.substring(0, 300));
  }
}

main().catch(e => console.log('Error:', e.message));
