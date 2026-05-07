const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require' }
  }
});

async function main() {
  const portraitHash = crypto.randomBytes(32).toString('hex');
  const idHash = crypto.randomBytes(32).toString('hex');
  
  const updated = await prisma.portrait.update({
    where: { id: 'cmov61fqr000jfgzksk1udphc' },
    data: {
      portraitImageHash: portraitHash,
      idCardFrontHash: idHash
    }
  });
  console.log('Updated:', updated.id, '| pHash:', portraitHash, '| idHash:', idHash);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });