const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const fs = require('fs');

try {
  // Get translations.ts from portraitpay-frontend main branch
  const content = execSync('git cat-file -p refs/remotes/frontend/main:src/lib/i18n/translations.ts', { cwd: path });
  const lines = content.toString('utf8').split('\n');
  console.log('Total lines:', lines.length);
  console.log('\nLine 2120:', lines[2119] ? lines[2119].substring(0, 80) : 'N/A');
  console.log('Line 2121:', lines[2120] ? lines[2120].substring(0, 80) : 'N/A');
  console.log('Line 2122:', lines[2121] ? lines[2121].substring(0, 80) : 'N/A');
  console.log('Line 2123:', lines[2122] ? lines[2122].substring(0, 80) : 'N/A');
  console.log('Line 2124:', lines[2123] ? lines[2123].substring(0, 80) : 'N/A');
  console.log('Line 2125:', lines[2124] ? lines[2124].substring(0, 80) : 'N/A');
  console.log('Line 2126:', lines[2125] ? lines[2125].substring(0, 80) : 'N/A');
  console.log('Line 2127:', lines[2126] ? lines[2126].substring(0, 80) : 'N/A');
  console.log('Line 2128:', lines[2127] ? lines[2127].substring(0, 80) : 'N/A');
  console.log('Line 2129:', lines[2128] ? lines[2128].substring(0, 80) : 'N/A');
  console.log('Line 2130:', lines[2129] ? lines[2129].substring(0, 80) : 'N/A');
  
  // Check for any weird characters
  console.log('\nChecking for non-ASCII in last lines...');
  for (let i = 2115; i < lines.length; i++) {
    const l = lines[i];
    if (l && /[^\x00-\x7F]/.test(l) && l.length < 100) {
      // Has non-ASCII, check for replacement char
      if (l.includes('\uFFFD')) {
        console.log('Line ' + (i+1) + ' has replacement char:', l.substring(0, 60));
      }
    }
  }
  
} catch(e) {
  console.log('Error:', e.message);
  console.log('Stderr:', e.stderr ? e.stderr.toString().substring(0, 300) : 'none');
}
