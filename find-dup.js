const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function main() {
  // Find duplicate imageHash entries (same hash uploaded more than once)
  const duplicates = await prisma.portrait.groupBy({
    by: ['imageHash'],
    _count: { imageHash: true },
    having: { imageHash: { _count: { gt: 1 } } }
  });

  if (duplicates.length === 0) {
    console.log('No duplicate portrait records found.');
  } else {
    console.log('Found duplicate imageHash entries:', duplicates.length);
    for (const d of duplicates) {
      // Find all portraits with this hash
      const portraits = await prisma.portrait.findMany({
        where: { imageHash: d.imageHash },
        select: { id: true, userId: true, title: true, createdAt: true }
      });
      console.log(`\nimageHash ${d.imageHash} (${d._count.imageHash} times):`);
      portraits.forEach(p => console.log(`  - id=${p.id}, userId=${p.userId}, title="${p.title}", createdAt=${p.createdAt}`));
      
      // Delete all but the oldest one (keep first)
      const sorted = portraits.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const toDelete = sorted.slice(1);
      console.log(`  Deleting ${toDelete.length} duplicates (keeping oldest: ${sorted[0].id})`);
      await prisma.portrait.deleteMany({
        where: { id: { in: toDelete.map(p => p.id) } }
      });
      console.log(`  Deleted ${toDelete.length} records`);
    }
  }

  // Also check for orphaned/orphaned cert records
  const orphanCerts = await prisma.certificate.findMany({
    where: {
      portraitId: { not: null }
    },
    include: { portrait: true }
  });
  const orphan = orphanCerts.filter(c => !c.portrait);
  if (orphan.length > 0) {
    console.log(`\nOrphaned certificates: ${orphan.length}`);
    for (const c of orphan) {
      console.log(`  Deleting orphan cert id=${c.id}`);
      await prisma.certificate.delete({ where: { id: c.id } });
    }
  }

  console.log('\nDone!');
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
