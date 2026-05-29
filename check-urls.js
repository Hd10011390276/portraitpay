const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const portraits = await prisma.portrait.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, portraitImageUrl: true, originalImageUrl: true, status: true }
  });
  console.log(JSON.stringify(portraits, null, 2));
  await prisma.$disconnect();
}
main().catch(console.error);