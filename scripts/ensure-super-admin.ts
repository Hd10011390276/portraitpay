/**
 * scripts/ensure-super-admin.ts
 * Idempotent script to ensure 799096322@qq.com is SUPER_ADMIN
 * Run: npx tsx scripts/ensure-super-admin.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET_EMAIL = "799096322@qq.com";

async function main() {
  console.log(`Looking for user: ${TARGET_EMAIL}`);

  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, email: true, role: true, emailVerified: true },
  });

  if (!user) {
    console.error(`User with email ${TARGET_EMAIL} not found.`);
    process.exit(1);
  }

  console.log(`Found: id=${user.id}, role=${user.role}, emailVerified=${user.emailVerified}`);

  const updates: string[] = [];

  if (user.role !== "SUPER_ADMIN") {
    updates.push(`role: ${user.role} → SUPER_ADMIN`);
  }
  if (!user.emailVerified) {
    updates.push(`emailVerified: ${user.emailVerified} → true`);
  }

  if (updates.length === 0) {
    console.log("Already SUPER_ADMIN with emailVerified=true — nothing to do.");
    return;
  }

  console.log(`Will update: ${updates.join(", ")}`);

  const updated = await prisma.user.update({
    where: { email: TARGET_EMAIL },
    data: {
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
    select: { id: true, email: true, role: true, emailVerified: true },
  });

  console.log(`Done: id=${updated.id}, role=${updated.role}, emailVerified=${updated.emailVerified}`);
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());