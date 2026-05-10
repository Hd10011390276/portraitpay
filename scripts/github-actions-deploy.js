const { execSync } = require('child_process');

const VER_TOKEN = (process.env.VERCEL_TOKEN || '').replace(/[\n\r]/g, '');
const DB_URL = (process.env.DATABASE_URL || '').replace(/[\n\r]/g, '');
const DIRECT_URL = (process.env.DIRECT_URL || '').replace(/[\n\r]/g, '');

function deployWithCli() {
  console.log('Building and deploying via Vercel CLI...');
  try {
    // Step 1: Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Step 2: Build using next build
    console.log('Running next build...');
    execSync('npx next build', { stdio: 'inherit' });

    // Step 3: Deploy prebuilt output
    console.log('Deploying prebuilt output...');
    const output = execSync(
      `npx vercel --prod --yes --prebuilt --token ${VER_TOKEN}`,
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
    console.log('✅ Deploy succeeded');
    console.log(output.substring(0, 2000));
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    console.error('❌ Deploy failed:', output.substring(0, 1500));
    process.exit(1);
  }
}

console.log('Starting deployment...');
deployWithCli();