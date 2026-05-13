/**
 * Test email sending via the actual sendVerificationEmail function used in registration.
 * Usage: npx ts-node scripts/test-email.ts user@example.com
 *
 * This script uses the SAME sendVerificationEmail function as register/route.ts,
 * NOT a separate SMTP test, to verify the real code path works.
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";
import { sendVerificationEmail } from "../src/lib/email";

const TEST_EMAIL = process.argv[2];

if (!TEST_EMAIL) {
  console.error("Usage: npx ts-node scripts/test-email.ts <email>");
  console.error("Example: npx ts-node scripts/test-email.ts test@example.com");
  process.exit(1);
}

async function main() {
  console.log("=== Email Test Script ===");
  console.log("Testing sendVerificationEmail function (same as registration flow)");
  console.log("Target:", TEST_EMAIL);
  console.log("");

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    // Find or create a test user
    let user = await prisma.user.findFirst({
      where: { email: TEST_EMAIL, deletedAt: null },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      // Create a temporary test user
      console.log("No existing user found, creating temporary test user...");
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.hash("TestPassword123!", 12);
      user = await prisma.user.create({
        data: {
          email: TEST_EMAIL,
          name: "Email Test",
          passwordHash: hash,
          role: "TALENT",
          emailVerified: false,
        },
        select: { id: true, email: true, name: true },
      });
      console.log("Created test user:", user.id);
    } else {
      console.log("Found existing user:", user.id);
    }

    console.log("");
    console.log("Calling sendVerificationEmail...");
    console.log("SMTP_HOST:", process.env.SMTP_HOST ?? "(not set)");
    console.log("SMTP_USER:", process.env.SMTP_USER ?? "(not set)");
    console.log("SMTP_PASS:", process.env.SMTP_PASS ? "***(set)***" : "(not set)");
    console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "***(set)***" : "(not set)");
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL ?? "(not set)");
    console.log("");

    const result = await sendVerificationEmail({
      userId: user.id,
      email: user.email,
      name: user.name ?? user.email.split("@")[0],
      prisma,
    });

    console.log("");
    console.log("=== Result ===");
    if (result.sent) {
      console.log("✅ Email sent successfully!");
      console.log("   Code:", result.code);
    } else {
      console.log("❌ Email FAILED to send");
      console.log("   Error:", result.error);
    }

    await prisma.$disconnect();
    process.exit(result.sent ? 0 : 1);
  } catch (err) {
    console.error("❌ Script error:", err instanceof Error ? err.message : String(err));
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
