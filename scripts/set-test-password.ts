/**
 * scripts/set-test-password.ts
 * Set known password for a test/super-admin account.
 * Run: npx tsx scripts/set-test-password.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "799096322@qq.com";
  const password = process.argv[3] || "Test@123456";

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, emailVerified: true },
  });

  if (!user) {
    console.error(`User ${email} not found`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: {
      passwordHash: hash,
      emailVerified: true,
    },
    select: { id: true, email: true, role: true, emailVerified: true },
  });

  console.log(`Password set for ${email}`);
  console.log(`  id: ${updated.id}`);
  console.log(`  role: ${updated.role}`);
  console.log(`  emailVerified: ${updated.emailVerified}`);
  console.log(`  login: ${email} / ${password}`);
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());