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
  // Get portraitpay-frontend main branch SHA
  const branch = await api('/repos/Hd10011390276/portraitpay-frontend/branches/main');
  if (branch.status !== 200) { console.log('Branch error:', branch.status); return; }
  const mainSha = JSON.parse(branch.data).commit.sha;
  console.log('portraitpay-frontend main SHA:', mainSha);
  
  // Get the tree to find translations.ts
  const tree = await api('/repos/Hd10011390276/portraitpay-frontend/git/trees/' + mainSha + '?recursive=1');
  if (tree.status !== 200) { console.log('Tree error:', tree.status); return; }
  const j = JSON.parse(tree.data);
  const tFile = j.tree.find(t => t.path === 'src/lib/i18n/translations.ts');
  console.log('translations.ts SHA:', tFile ? tFile.sha : 'NOT FOUND');
  
  if (tFile) {
    // Get the blob content
    const blob = await api('/repos/Hd10011390276/portraitpay-frontend/git/blobs/' + tFile.sha);
    if (blob.status === 200) {
      const blobJ = JSON.parse(blob.data);
      const content = Buffer.from(blobJ.content, 'base64').toString('utf8');
      console.log('\nGitHub blob size:', content.length);
      console.log('GitHub blob lines:', content.split('\n').length);
      
      // Check first 5 lines
      const lines = content.split('\n');
      console.log('\nFirst 5 lines:');
      for (let i = 0; i < 5; i++) console.log('  ' + (i+1) + ':', JSON.stringify(lines[i]));
      
      // Check for null bytes
      const buf = Buffer.from(blobJ.content, 'base64');
      console.log('\nNull bytes in base64-decoded blob:', buf.filter(b => b === 0).length);
      console.log('First 20 bytes hex:', buf.slice(0, 20).toString('hex'));
      
      // Check if it matches local
      const fs = require('fs');
      const local = fs.readFileSync('C:/Users/Administrator/.openclaw/workspace/portraitpay/src/lib/i18n/translations.ts');
      console.log('\nLocal size:', local.length, 'GitHub size:', buf.length);
      console.log('Match:', Buffer.compare(local, buf) === 0 ? 'YES' : 'NO');
    }
  }
}

main();
