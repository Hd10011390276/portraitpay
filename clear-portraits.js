const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function main() {
  // Delete all 4 recent portrait records for this owner
  const ids = ['cmobhw3kl000v14pe564o8r2t', 'cmobhuljr000r14pea2zhtvby', 'cmobhtx6p000n14pen2190ow5', 'cmobht5wr000h14pebgjlqng4'];
  
  console.log('Deleting portrait records:', ids);
  for (const id of ids) {
    await prisma.portrait.delete({ where: { id } });
    console.log('  Deleted:', id);
  }

  const remaining = await prisma.portrait.count();
  console.log('Remaining portraits:', remaining);
  console.log('\nDone! You can now upload a new portrait.');
}

main()
  .catch(function(e) { console.error('Error:', e.message); process.exit(1); })
  .finally(function() { prisma.$disconnect(); });
