const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const token = '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';

try {
  // Add portraitpay-frontend as a second remote
  console.log('Adding portraitpay-frontend remote...');
  execSync('git remote add frontend https://' + token + '@github.com/Hd10011390276/portraitpay-frontend.git', { cwd: path });
  console.log('Remote added.');
  
  // Push main branch to portraitpay-frontend repo
  console.log('Pushing to portraitpay-frontend main branch...');
  const out = execSync('git push frontend main --force', { cwd: path });
  console.log('Push output:', out.toString());
  console.log('✅ Pushed to portraitpay-frontend!');
} catch(e) {
  console.log('Error:', e.message);
  console.log('Stderr:', e.stderr ? e.stderr.toString() : 'none');
}
