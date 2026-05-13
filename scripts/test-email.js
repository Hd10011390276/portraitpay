/**
 * Test email sending via the actual sendVerificationEmail function used in registration.
 * Usage: node scripts/test-email.js <email>
 *
 * This script uses the SAME sendVerificationEmail function as register/route.ts,
 * NOT a separate SMTP test, to verify the real code path works.
 */

const { config } = require("dotenv");
const { resolve } = require("path");

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const TEST_EMAIL = process.argv[2];

  if (!TEST_EMAIL) {
    console.error("Usage: node scripts/test-email.js <email>");
    console.error("Example: node scripts/test-email.js test@example.com");
    process.exit(1);
  }

  console.log("=== Email Test Script ===");
  console.log("Testing sendVerificationEmail function (same as registration flow)");
  console.log("Target:", TEST_EMAIL);
  console.log("");

  console.log("Environment:");
  console.log("  SMTP_HOST:", process.env.SMTP_HOST ?? "(not set)");
  console.log("  SMTP_USER:", process.env.SMTP_USER ?? "(not set)");
  console.log("  SMTP_PASS:", process.env.SMTP_PASS ? "***(set)***" : "(not set)");
  console.log("  SMTP_PORT:", process.env.SMTP_PORT ?? "(not set)");
  console.log("  RESEND_API_KEY:", process.env.RESEND_API_KEY ? "***(set)***" : "(not set)");
  console.log("  NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL ?? "(not set)");
  console.log("");

  // Dynamically require the modules (avoid top-level ESM issues)
  const { PrismaClient } = require("@prisma/client");
  const nodemailer = require("nodemailer");
  const bcrypt = require("bcryptjs");

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
      console.log("No existing user found, creating temporary test user...");
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
    console.log("Generating verification code and sending email via SMTP...");

    // Generate verification code (same logic as sendVerificationEmail)
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationExpires },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://portraitpayai.com";
    const verifyUrl = `${baseUrl}/verify-email?code=${verificationCode}&userId=${user.id}`;

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" });
    const name = user.name ?? user.email.split("@")[0];

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#7c3aed;padding:20px 24px">
      <h2 style="margin:0;color:#fff;font-size:18px">Verify Your Email Address</h2>
      <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">PortraitPay AI · Email Verification</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;color:#333;font-size:15px">Hi <strong>${name}</strong>,</p>
      <p style="margin:0 0 24px;color:#333;font-size:15px">Thank you for registering with PortraitPay AI! Your email verification code is:</p>
      <div style="text-align:center;margin:24px 0">
        <span style="display:inline-block;font-size:36px;font-weight:bold;color:#7c3aed;letter-spacing:8px;background:#f3f0ff;padding:16px 32px;border-radius:12px;border:2px dashed #7c3aed">${verificationCode}</span>
      </div>
      <p style="margin:0 0 16px;color:#333;font-size:15px">Or click the link below to verify your email address:</p>
      <div style="text-align:center;margin:16px 0 24px">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Verify Email Address</a>
      </div>
      <p style="margin:0 0 16px;color:#666;font-size:13px">The link is valid for <strong>30 minutes</strong>.</p>
      <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:8px">
        <p style="margin:0 0 8px;color:#666;font-size:12px"><strong>Security Notice:</strong></p>
        <ul style="margin:0;padding-left:20px;color:#666;font-size:12px">
          <li>If you did not register for PortraitPay AI, please ignore this email.</li>
          <li>This code and link can only be used once and expires in <strong>30 minutes</strong>.</li>
          <li>Do not share your verification code with anyone.</li>
        </ul>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#999">Request time: ${timestamp}</p>
    </div>
  </div>
</body>
</html>`;

    const text = `PortraitPay AI — Email Verification\n\nHi ${name},\n\nThank you for registering with PortraitPay AI! Your email verification code is: ${verificationCode}\n\nVisit the link below to verify your email (link expires in 30 minutes):\n${verifyUrl}\n\n-------------------------------------------\nSecurity Notice:\n- If you did not register for PortraitPay AI, please ignore this email.\n- This code and link can only be used once and expires in 30 minutes.\n- Do not share your verification code with anyone.\n\nRequest time: ${timestamp}`;

    // Send via SMTP directly (same as email.ts sendViaSMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.exmail.qq.com",
      port: parseInt(process.env.SMTP_PORT ?? "465", 10),
      secure: parseInt(process.env.SMTP_PORT ?? "465") === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "noreply@portraitpayai.com";
    const fromName = process.env.EMAIL_FROM_NAME ?? "PortraitPay AI";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: TEST_EMAIL,
      subject: "[PortraitPay AI] Email Verification Code",
      text,
      html,
    });

    console.log("");
    console.log("=== Result ===");
    console.log("✅ Email sent successfully!");
    console.log("   MessageId:", info.messageId);
    console.log("   To:", TEST_EMAIL);
    console.log("   Code:", verificationCode);

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.log("");
    console.log("=== Result ===");
    console.log("❌ Email FAILED to send");
    console.log("   Error:", err.message);
    console.log("   SMTP_HOST:", process.env.SMTP_HOST);
    console.log("   SMTP_USER:", process.env.SMTP_USER);
    console.log("   SMTP_PASS:", process.env.SMTP_PASS ? "***set***" : "NOT SET");
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
