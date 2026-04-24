const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function main() {
  const count = await prisma.portrait.count();
  console.log('Total portraits:', count);

  const recent = await prisma.portrait.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, ownerId: true, title: true, imageHash: true, createdAt: true }
  });

  console.log('\nRecent portraits:');
  recent.forEach(p => console.log(`  ${p.id} | ${p.ownerId} | "${p.title}" | ${p.imageHash ? p.imageHash.slice(0,16)+'...' : 'null'} | ${p.createdAt}`));

  const hashCounts = {};
  for (const p of recent) {
    if (p.imageHash) {
      if (!hashCounts[p.imageHash]) hashCounts[p.imageHash] = [];
      hashCounts[p.imageHash].push(p.id);
    }
  }

  const dups = Object.entries(hashCounts).filter(function(e) { return e[1].length > 1; });
  if (dups.length > 0) {
    console.log('\nDuplicates:');
    for (const [h, ids] of dups) {
      console.log(`  Hash ${h.slice(0,16)}... appears ${ids.length} times: ${ids.join(', ')}`);
      const toDelete = ids.slice(1);
      console.log(`  Deleting ${toDelete.length} duplicates...`);
      await prisma.portrait.deleteMany({ where: { id: { in: toDelete } } });
    }
  } else {
    console.log('\nNo duplicate hashes among recent portraits.');
  }

  console.log('\nDone!');
}

main()
  .catch(function(e) { console.error('Error:', e.message); process.exit(1); })
  .finally(function() { prisma.$disconnect(); });
