const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';

// Verify what's in portraitpay-frontend at the tip
try {
  console.log('Fetching portraitpay-frontend main branch...');
  const sha = execSync('git ls-remote frontend refs/heads/main', { cwd: path }).toString().trim().split('\t')[0];
  console.log('portraitpay-frontend main SHA:', sha);
  
  // Show recent commits on frontend remote
  console.log('\nRecent commits on portraitpay-frontend:');
  const log = execSync('git log frontend/main --oneline -5', { cwd: path }).toString();
  console.log(log);
  
  // Compare with local
  const localSha = execSync('git rev-parse HEAD', { cwd: path }).toString().trim();
  console.log('Local HEAD SHA:', localSha);
  console.log('Match:', sha === localSha ? 'YES' : 'NO - mismatch!');
  
  // Check translations.ts line count
  const lines = execSync('git show frontend/main:src/lib/i18n/translations.ts | wc -l', { cwd: path }).toString().trim();
  console.log('Frontend translations.ts lines:', lines);
} catch(e) {
  console.log('Error:', e.message);
}
