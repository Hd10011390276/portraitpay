const fs = require('fs');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';

const dbUrl = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Write a .ps1 file that properly handles the characters
const script = `
$env:VERCEL_TOKEN = "${token}"
$dbUrl = "${dbUrl}"
Set-Location "${path.replace(/\\/g, "\\\\")}"
Write-Output "DB URL length: $($dbUrl.Length)"
$n = Start-Process -FilePath "npx" -ArgumentList "vercel","env","add","DATABASE_URL","secret","production","--yes" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "stdout.txt" -RedirectStandardError "stderr.txt" -WorkingDirectory "${path.replace(/\\/g, "\\\\")}"
Write-Output "Exit: $LASTEXITCODE"
Get-Content "stdout.txt" -Raw
Get-Content "stderr.txt" -Raw
`;

fs.writeFileSync(path + '/add-env.ps1', script, { encoding: 'utf8' });
console.log('Script written');

// Try a different approach - use node spawn directly with env set
const { spawn } = require('child_process');
const env = { ...process.env, VERCEL_TOKEN: token };

console.log('Trying npx vercel env add...');
const p = spawn('npx', ['vercel', 'env', 'add', 'DATABASE_URL', 'secret', 'production', '--yes'], {
  cwd: path,
  env: env,
  stdio: ['pipe', 'pipe', 'pipe']
});

let out = '', err = '';
p.stdout.on('data', d => out += d.toString());
p.stderr.on('data', d => err += d.toString());
p.on('close', code => {
  console.log('Exit:', code);
  console.log('STDOUT:', out.substring(0, 300));
  console.log('STDERR:', err.substring(0, 300));
});
p.on('error', e => console.log('Error:', e.message));
setTimeout(() => { console.log('Timeout'); p.kill(); }, 25000);