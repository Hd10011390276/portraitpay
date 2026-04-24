const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';

try {
  // Check if there's a .gitattributes affecting line endings
  const gitattr = execSync('git check-attr text -- src/lib/i18n/translations.ts', { cwd: path }).toString().trim();
  console.log('.gitattributes text attr:', gitattr);
  
  // Check the actual file content encoding from git
  const blobContent = execSync('git cat-file -p HEAD:src/lib/i18n/translations.ts', { cwd: path });
  console.log('\nFirst 30 bytes hex:', blobContent.slice(0, 30).toString('hex'));
  console.log('Last 30 bytes hex:', blobContent.slice(-30).toString('hex'));
  
  // Check if there's any weird BOM or encoding
  const firstBytes = blobContent.slice(0, 5);
  console.log('First 5 bytes:', [...firstBytes].map(b => b + '(' + String.fromCharCode(b) + ')'));
  
  // Check total lines
  const lines = blobContent.toString('utf8').split('\n');
  console.log('Total lines:', lines.length);
  
  // Look at line 1 and 2
  console.log('Line 1:', JSON.stringify(lines[0]));
  console.log('Line 2:', JSON.stringify(lines[1]));
  
  // Check: is there a BOM?
  console.log('Has UTF-8 BOM (EF BB BF):', firstBytes[0] === 0xEF && firstBytes[1] === 0xBB && firstBytes[2] === 0xBF);
  
  // Check for any null bytes in first 100 lines
  let nullCount = 0;
  for (let i = 0; i < 100; i++) {
    if (blobContent[i] === 0) nullCount++;
  }
  console.log('Null bytes in first 100:', nullCount);
  
} catch(e) {
  console.log('Error:', e.message);
}
