const { execSync } = require('child_process');

const VER_TOKEN = (process.env.VERCEL_TOKEN || '').replace(/[\n\r]/g, '');
const DB_URL = (process.env.DATABASE_URL || '').replace(/[\n\r]/g, '');
const DIRECT_URL = (process.env.DIRECT_URL || '').replace(/[\n\r]/g, '');

console.log('Deploying to Vercel...');

try {
  const output = execSync(
    `npx vercel --prod --yes --token ${VER_TOKEN}`,
    {
      encoding: 'utf8',
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DATABASE_URL: DB_URL,
        DIRECT_URL: DIRECT_URL,
      },
    }
  );
  console.log('✅ Deploy completed');
  console.log(output.substring(0, 2000));
} catch (err) {
  const output = (err.stdout || '') + (err.stderr || '');
  console.error('❌ Deploy failed');
  console.error(output.substring(0, 2000));
  process.exit(1);
}