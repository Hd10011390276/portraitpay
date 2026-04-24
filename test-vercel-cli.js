const { spawn } = require('child_process');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';

// Use npx vercel env pull to see what's in the current project
console.log('Testing Vercel CLI...');
const p = spawn('npx', ['vercel', 'token'], { cwd: path, shell: true });
let out = '';
p.stdout.on('data', d => out += d);
p.on('close', code => {
  console.log('vercel token exit:', code, out);
});
p.on('error', e => console.log('error:', e.message));