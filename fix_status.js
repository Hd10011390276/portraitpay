const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  const txHash = '0xd2f64d77da202f3930391eaf9a45e029e0eb24d3ef0b3b1d535a5135e7fdd778';
  
  const updated = await prisma.portrait.update({
    where: { id: 'cmov00ity0001704yxpjoagji' },
    data: {
      status: 'CERTIFIED',
      blockchainTxHash: txHash,
      certifiedAt: new Date('2026-05-07T05:01:00Z')
    }
  });
  
  console.log('Updated:', updated.id, '| status:', updated.status, '| tx:', updated.blockchainTxHash);
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });