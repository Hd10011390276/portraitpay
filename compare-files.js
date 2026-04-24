const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const fs = require('fs');

try {
  // Check local translations.ts
  const local = fs.readFileSync(path + '/src/lib/i18n/translations.ts');
  console.log('=== LOCAL FILE ===');
  console.log('Size:', local.length);
  console.log('Null bytes:', local.filter(b => b === 0).length);
  console.log('First 10 bytes hex:', local.slice(0, 10).toString('hex'));
  console.log('Last 20 bytes:', local.slice(-20).toString('utf8').replace(/\n/g, '\\n'));
  
  // Check what's at HEAD
  const head = execSync('git cat-file -p HEAD:src/lib/i18n/translations.ts', { cwd: path });
  console.log('\n=== GIT HEAD ===');
  console.log('Size:', head.length);
  console.log('Null bytes:', head.filter(b => b === 0).length);
  
  // Check what's at b410886
  const commit = execSync('git cat-file -p b410886:src/lib/i18n/translations.ts', { cwd: path });
  console.log('\n=== COMMIT b410886 ===');
  console.log('Size:', commit.length);
  console.log('Null bytes:', commit.filter(b => b === 0).length);
  
  // Check frontend remote b410886
  const remote = execSync('git cat-file -p frontend/b410886:src/lib/i18n/translations.ts', { cwd: path });
  console.log('\n=== FRONTEND REMOTE b410886 ===');
  console.log('Size:', remote.length);
  console.log('Null bytes:', remote.filter(b => b === 0).length);
  
  // Do they match?
  console.log('\nLocal === HEAD:', Buffer.compare(local, head) === 0 ? 'YES' : 'NO');
  console.log('Local === b410886:', Buffer.compare(local, commit) === 0 ? 'YES' : 'NO');
  console.log('HEAD === frontend/b410886:', Buffer.compare(head, remote) === 0 ? 'YES' : 'NO');
  
} catch(e) {
  console.log('Error:', e.message);
}
