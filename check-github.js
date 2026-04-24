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
        'Accept': 'application/vnd.github.v3+json'
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
  // Get the content of translations.ts from portraitpay-frontend at commit b410886
  const r = await api('/repos/Hd10011390276/portraitpay-frontend/git/trees/b410886?recursive=1');
  if (r.status === 200) {
    const j = JSON.parse(r.data);
    const translations = j.tree.find(t => t.path === 'src/lib/i18n/translations.ts');
    console.log('translations.ts SHA:', translations ? translations.sha : 'NOT FOUND');
    console.log('Total files:', j.tree.length);
    
    // Check a few key files
    const keyFiles = j.tree.filter(t => t.path.includes('translations') || t.path.includes('package.json'));
    keyFiles.forEach(f => console.log(' ', f.path, ':', f.sha));
  } else {
    console.log('Error:', r.status, r.data.substring(0, 200));
  }
}

main();
