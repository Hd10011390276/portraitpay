const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  },
  log: ['error', 'warn'],
});

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma connected! Result:', JSON.stringify(result));
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.log('❌ Prisma error:', e.message.substring(0, 300));
    console.log('Error code:', e.code);
    console.log('Error name:', e.name);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setTimeout(() => { console.log('Timeout'); process.exit(1); }, 15000);
test();
