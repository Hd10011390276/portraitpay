const { execSync } = require('child_process');

const VER_TOKEN = (process.env.VERCEL_TOKEN || '').replace(/[\n\r]/g, '');

function deployWithCli() {
  console.log('Building and deploying via Vercel CLI (local build)...');
  try {
    // Step 1: Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Step 2: Build locally — avoids Vercel clone + build quota issues
    console.log('Running Next.js build locally...');
    execSync('npx next build', { stdio: 'inherit' });

    // Step 3: Deploy prebuilt output — skips Vercel's clone step
    console.log('Deploying prebuilt output to Vercel...');
    const output = execSync(
      `vercel --prod --yes --token ${VER_TOKEN} --prebuilt`,
      { encoding: 'utf8', env: { ...process.env, NODE_ENV: 'production' } }
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