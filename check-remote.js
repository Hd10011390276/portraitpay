const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const fs = require('fs');

try {
  // Get the exact bytes of translations.ts at b410886 from the frontend remote
  console.log('Fetching translations.ts from portraitpay-frontend at b410886...');
  
  // Check the raw file size from git
  const size = execSync('git cat-file -p frontend/b410886:src/lib/i18n/translations.ts 2>&1 | wc -c', { cwd: path }).toString().trim();
  console.log('File size (bytes):', size);
  
  // Check first 20 bytes
  const firstBytes = execSync('git cat-file -p frontend/b410886:src/lib/i18n/translations.ts 2>&1 | head -c 20 | xxd', { cwd: path }).toString().trim();
  console.log('First 20 bytes hex:', firstBytes.substring(0, 60));
  
  // Get line count
  const lineCount = execSync('git cat-file -p frontend/b410886:src/lib/i18n/translations.ts 2>&1 | find /c /v ""', { cwd: path }).toString().trim();
  console.log('Line count:', lineCount);
  
  // Check if there are null bytes
  const buf = execSync('git cat-file -p frontend/b410886:src/lib/i18n/translations.ts', { cwd: path });
  console.log('Null bytes:', buf.filter(b => b === 0).length);
  console.log('File size from node:', buf.length);
  
  // Check last line
  const lastLine = execSync('git cat-file -p frontend/b410886:src/lib/i18n/translations.ts 2>&1 | findstr /n "$" | findstr "^999"', { cwd: path }).toString().trim();
  console.log('Last few lines:', lastLine);
  
} catch(e) {
  console.log('Error:', e.message);
  // Fallback: check local
  const local = fs.readFileSync(path + '/src/lib/i18n/translations.ts');
  console.log('Local null bytes:', local.filter(b => b === 0).length);
  console.log('Local size:', local.length);
}
