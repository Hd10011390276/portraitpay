const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require' }
  }
});

async function main() {
  const portrait = await prisma.portrait.findUnique({
    where: { id: 'cmov3bdn60001ecx4cjv9pt07' },
    select: {
      id: true,
      title: true,
      blockchainTxHash: true,
      portraitImageHash: true,
      idCardType: true,
      idCardName: true,
      idCardNumber: true,
      certifiedAt: true,
    }
  });
  console.log('Portrait:', JSON.stringify(portrait, null, 2));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });