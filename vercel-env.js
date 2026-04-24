const https = require('https');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const projectId = 'prj_6FYHbjqW3UebcAxGAwuIk0wXcVpr';

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
      res.on('end', () => resolve({ status: res.statusCode, data: data.substring(0, 500) }));
    });
    req.on('error', e => resolve({ status: -1, data: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: -2, data: 'timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const authSecret = require('crypto').randomBytes(32).toString('base64');

  // Step 1: Try to find DATABASE_URL by searching all possible endpoints
  // Try GET by key name
  const byKey = await api('GET', '/v6/projects/' + projectId + '/env/DATABASE_URL');
  console.log('GET by key:', byKey.status, byKey.data);

  // Step 2: Try DELETE by key name  
  const delByKey = await api('DELETE', '/v6/projects/' + projectId + '/env/DATABASE_URL');
  console.log('DELETE by key:', delByKey.status, delByKey.data);

  // Step 3: Try POST to create (if it was deleted)
  const post = await api('POST', '/v6/projects/' + projectId + '/env', {
    key: 'DATABASE_URL',
    value: dbUrl,
    target: ['production'],
    type: 'plain'
  });
  console.log('POST create:', post.status, post.data);

  if (post.status === 200 || post.status === 201) {
    // Add AUTH_SECRET
    const r2 = await api('POST', '/v6/projects/' + projectId + '/env', {
      key: 'AUTH_SECRET', value: authSecret, target: ['production'], type: 'plain'
    });
    console.log('AUTH_SECRET:', r2.status, r2.data);
    
    const r3 = await api('POST', '/v6/projects/' + projectId + '/env', {
      key: 'AUTH_URL', value: 'https://portraitpayai.com', target: ['production'], type: 'plain'
    });
    console.log('AUTH_URL:', r3.status, r3.data);
    
    const r4 = await api('POST', '/v6/projects/' + projectId + '/env', {
      key: 'NEXTAUTH_URL', value: 'https://portraitpayai.com', target: ['production'], type: 'plain'
    });
    console.log('NEXTAUTH_URL:', r4.status, r4.data);
  }
}

main();
