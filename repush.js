const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';

try {
  // Verify what's in portraitpay-frontend remote now
  console.log('Verifying portraitpay-frontend remote content...');
  const sha = execSync('git rev-parse refs/remotes/frontend/main', { cwd: path }).toString().trim();
  console.log('Remote main SHA:', sha, '(should be b410886)');
  
  // Check if portraitpay-frontend has the right content
  const content = execSync('git cat-file -p refs/remotes/frontend/main:src/lib/i18n/translations.ts', { cwd: path });
  console.log('Remote translations.ts size:', content.length);
  console.log('Null bytes:', content.filter(b => b === 0).length);
  
  // Get the commit message
  const msg = execSync('git log frontend/main --oneline -1', { cwd: path }).toString().trim();
  console.log('Remote tip commit:', msg);
  
} catch(e) {
  console.log('Error:', e.message);
}
