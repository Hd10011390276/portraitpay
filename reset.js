const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require' }
  }
});

async function main() {
  const updated = await prisma.portrait.update({
    where: { id: 'cmov2xf6m0005sa119ymldyd5' },
    data: { status: 'DRAFT', blockchainTxHash: null, blockchainNetwork: 'sepolia', certifiedAt: null }
  });
  console.log('Reset:', updated.id, '→', updated.status, '| tx:', updated.blockchainTxHash);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });