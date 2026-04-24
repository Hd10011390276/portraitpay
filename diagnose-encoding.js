const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const fs = require('fs');

try {
  // Check .gitattributes
  const gitattrs = fs.existsSync(path + '/.gitattributes') 
    ? fs.readFileSync(path + '/.gitattributes', 'utf8') 
    : 'NOT FOUND';
  console.log('.gitattributes:', gitattrs);
  
  // Check git config core.autocrlf
  const autocrlf = execSync('git config --local core.autocrlf', { cwd: path }).toString().trim();
  console.log('core.autocrlf:', autocrlf || '(not set)');
  
  // Check git config core.eol
  const coreEol = execSync('git config --local core.eol', { cwd: path }).toString().trim();
  console.log('core.eol:', coreEol || '(not set)');
  
  // Check what's in the git index for translations.ts
  const index = execSync('git ls-files -s -- src/lib/i18n/translations.ts', { cwd: path }).toString().trim();
  console.log('\nGit index for translations.ts:');
  console.log(index);
  
  // Check the actual blob in git
  const blob = execSync('git cat-file -p :0:src/lib/i18n/translations.ts 2>&1 | wc -c', { cwd: path }).toString().trim();
  console.log('\nBlob size from :0:', blob);
  
  // Check the working tree file
  const working = fs.statSync(path + '/src/lib/i18n/translations.ts');
  console.log('Working file size:', working.size);
  console.log('Working file mode:', working.mode);
  
  // Check bytes at key positions
  const buf = fs.readFileSync(path + '/src/lib/i18n/translations.ts');
  console.log('\nFirst 30 bytes:', buf.slice(0, 30).toString('hex'));
  console.log('Null bytes:', buf.filter(b => b === 0).length);
  
  // Check if last line is properly terminated
  const lastBytes = buf.slice(-10);
  console.log('Last 10 bytes:', lastBytes.toString('hex'));
  console.log('Last char:', lastBytes[lastBytes.length-1], '(10=newline, 13=cr, 0=null)');
  
} catch(e) {
  console.log('Error:', e.message);
}
