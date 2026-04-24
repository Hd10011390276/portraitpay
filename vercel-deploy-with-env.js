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
  // Deploy with env vars embedded as object
  const deploy = await api('POST', '/v13/deployments', {
    name: 'portraitpay',
    gitSource: { type: 'github', repo: 'Hd10011390276/portraitpay', ref: 'main', repoId: 1192767896 },
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
    // Find the deployment ID in the response
    const idMatch = deploy.data.match(/"id":"(dpl_[^"]+)"/);
    const stateMatch = deploy.data.match(/"readyState":"([^"]+)"/);
    const urlMatch = deploy.data.match(/"url":"([^"]+)"/);
    
    const deployId = idMatch ? idMatch[1] : null;
    const state = stateMatch ? stateMatch[1] : 'BUILDING';
    const deployUrl = urlMatch ? urlMatch[1] : '';
    
    console.log('Deploy ID:', deployId);
    console.log('State:', state);
    console.log('URL:', deployUrl);
    
    if (deployId && state === 'BUILDING') {
      console.log('\nDeployment created, waiting for it to complete...');
      
      // Poll every 10s for up to 3 minutes
      for (let i = 0; i < 18; i++) {
        await new Promise(r => setTimeout(r, 10000));
        
        const check = await api('GET', '/v13/deployments/' + deployId);
        if (check.status === 200) {
          const sMatch = check.data.match(/"readyState":"([^"]+)"/);
          const curState = sMatch ? sMatch[1] : '?';
          const urlM = check.data.match(/"url":"([^"]+)"/);
          console.log('[' + (i+1) + '] State:', curState, '| URL:', urlM ? urlM[1] : '');
          
          if (curState === 'READY') {
            console.log('\n✅ Deploy succeeded! portraitpayai.com should work now.');
            process.exit(0);
          } else if (curState === 'ERROR') {
            const errMatch = check.data.match('"error":\{"message":"([^"]+)"');
            console.log('\n❌ Deploy failed:', errMatch ? errMatch[1] : 'unknown error');
            process.exit(1);
          }
        }
      }
      console.log('Timeout waiting for deploy');
    }
  } else {
    console.log('Deploy failed:', deploy.data.substring(0, 300));
  }
}

main().catch(e => console.log('Error:', e.message));
