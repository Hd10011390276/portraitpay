const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  // Update portrait with ID info
  const updated = await prisma.portrait.update({
    where: { id: 'cmov2xf6m0005sa119ymldyd5' },
    data: {
      idCardNumber: '1234567890',
    }
  });
  
  console.log('Updated:', updated.id, '| idCardType:', updated.idCardType, '| idCardName:', updated.idCardName, '| idCardNumber:', updated.idCardNumber);
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });