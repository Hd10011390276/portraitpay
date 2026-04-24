const { execSync } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';

try {
  const log = execSync('git log --oneline -10', { cwd: path }).toString();
  console.log('Git log:');
  console.log(log);
  
  const status = execSync('git status --short', { cwd: path }).toString();
  console.log('Status:', status || 'clean');
  
  const remote = execSync('git remote get-url origin', { cwd: path }).toString().trim();
  console.log('Remote:', remote);
} catch(e) {
  console.log('Error:', e.message);
}
