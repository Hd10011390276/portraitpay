const { spawn } = require('child_process');
const token = 'vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P';
const cwd = 'C:/Users/Administrator/.openclaw/workspace/portraitpay';

const commands = [
  ['npx.cmd', ['--yes', 'vercel', 'env', 'add', 'DATABASE_URL', 'production', '--token', token, '--', 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require']],
  ['npx.cmd', ['--yes', 'vercel', 'env', 'add', 'AUTH_SECRET', 'production', '--token', token, '--', 'Ta8gZ2Q6WJ4X3m9K7hR5N2P8E1F4L7A0D3C6B9X2Y5M8N1Q4W7Z0A3B6']],
  ['npx.cmd', ['--yes', 'vercel', 'env', 'add', 'NEXTAUTH_URL', 'production', '--token', token, '--', 'https://portraitpayai.com']],
  ['npx.cmd', ['--yes', 'vercel', 'env', 'add', 'AUTH_URL', 'production', '--token', token, '--', 'https://portraitpayai.com']],
];

let idx = 0;
function run() {
  if (idx >= commands.length) { console.log('All done!'); return; }
  const [cmd, args] = commands[idx++];
  console.log('Running:', args.slice(0, 3).join(' '));
  const p = spawn('cmd', ['/c', cmd, ...args], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
  let out = '', err = '';
  p.stdout.on('data', d => out += d.toString());
  p.stderr.on('data', d => err += d.toString());
  p.on('close', code => {
    console.log('Exit:', code, 'OUT:', out.substring(0, 200), 'ERR:', err.substring(0, 200));
    setTimeout(run, 2000);
  });
  p.on('error', e => { console.log('Error:', e.message); setTimeout(run, 2000); });
}
run();