const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const fs = require('fs');

try {
  // Check git config
  const autocrlf = execSync('git config --local core.autocrlf', { cwd: path }).toString().trim();
  const eol = execSync('git config --local core.eol', { cwd: path }).toString().trim();
  console.log('core.autocrlf:', autocrlf || '(unset)');
  console.log('core.eol:', eol || '(unset)');
  
  // Check if there's a system-level config
  const systemAutocrlf = execSync('git config --system core.autocrlf', { cwd: path }).toString().trim();
  console.log('system core.autocrlf:', systemAutocrlf || '(unset)');
  
  // Check the actual file bytes from git
  const blob = execSync('git cat-file -p HEAD:src/lib/i18n/translations.ts', { cwd: path });
  console.log('\nBlob size:', blob.length);
  
  // The file has 2304 lines - let's check what line endings look like
  // Count CR+LF vs LF only
  let crlf = 0, lf = 0;
  for (let i = 0; i < blob.length - 1; i++) {
    if (blob[i] === 13 && blob[i+1] === 10) crlf++;
    else if (blob[i] === 10) lf++;
  }
  if (blob[blob.length-1] === 10) lf++;
  console.log('CRLF count:', crlf, 'LF count:', lf);
  console.log('Total line endings:', crlf + lf);
  
  // Last 50 bytes
  console.log('\nLast 50 bytes hex:', blob.slice(-50).toString('hex'));
  
  // Check if file ends with newline
  console.log('File ends with newline:', blob[blob.length-1] === 10 ? 'YES' : 'NO');
  console.log('File ends with CR:', blob[blob.length-1] === 13 ? 'YES' : 'NO');
  
  // Check first line - should be "/**"
  console.log('First line:', blob.slice(0, 10).toString('utf8'));
  
} catch(e) {
  console.log('Error:', e.message);
}
