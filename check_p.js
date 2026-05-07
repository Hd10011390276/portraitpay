const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  const portrait = await prisma.portrait.findUnique({
    where: { id: 'cmov00ity0001704yxpjoagji' },
    include: { owner: true }
  });
  
  console.log('Portrait:', portrait.id, '| status:', portrait.status);
  console.log('Owner email:', portrait.owner.email);
  console.log('Portrait hash:', portrait.portraitImageHash);
  console.log('ID hash:', portrait.idCardFrontHash);
  console.log('TxHash:', portrait.blockchainTxHash);
  
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });