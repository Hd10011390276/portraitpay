/**
 * POST /api/auth/send-verification — Resend email verification with 6-digit code
 * Body: { email?: string, userId?: string }
 *
 * Generates a new 6-digit verification code and sends it to the user's email.
 * Non-blocking — does not reveal whether email exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

const SendVerificationSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  userId: z.string().min(1, "User ID is required").optional(),
}).refine((data) => data.email || data.userId, {
  message: "Either email or userId must be provided",
});

// Verification code expiry: 30 minutes
const VERIFY_CODE_EXPIRY_MS = 30 * 60 * 1000;

// ─── SMTP Email Helper ─────────────────────────────────────────────────────────
async function sendSmtpEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  let nodemailer: typeof import("nodemailer") | null = null;
  try {
    nodemailer = await import("nodemailer");
  } catch {
    throw new Error("nodemailer is not installed.");
  }
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP environment variables not configured.");
  }
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
  await transporter.sendMail({
    from: smtpFrom || smtpUser,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

// ─── Verification Email Template ────────────────────────────────────────────────
interface VerificationEmailParams {
  name: string;
  email: string;
  verifyUrl: string;
  verificationCode: string;
}

function buildVerificationEmailHtml(params: VerificationEmailParams): { subject: string; html: string; text: string } {
  const { name, email, verifyUrl, verificationCode } = params;
  const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#7c3aed;padding:20px 24px">
      <h2 style="margin:0;color:#fff;font-size:18px">重新发送邮箱验证码</h2>
      <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">PortraitPay AI · 邮箱验证</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;color:#333;font-size:15px">
        您好 <strong>${name}</strong>，
      </p>
      <p style="margin:0 0 24px;color:#333;font-size:15px">
        你的邮箱验证码为：
      </p>
      <div style="text-align:center;margin:24px 0">
        <span style="display:inline-block;font-size:36px;font-weight:bold;color:#7c3aed;letter-spacing:8px;background:#f3f0ff;padding:16px 32px;border-radius:12px;border:2px dashed #7c3aed">
          ${verificationCode}
        </span>
      </div>
      <p style="margin:0 0 16px;color:#333;font-size:15px">
        或者点击以下链接验证你的邮箱地址：
      </p>
      <div style="text-align:center;margin:16px 0 24px">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
          验证邮箱地址
        </a>
      </div>
      <p style="margin:0 0 16px;color:#666;font-size:13px">
        链接有效期为 <strong>30 分钟</strong>。
      </p>
      <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:8px">
        <p style="margin:0 0 8px;color:#666;font-size:12px"><strong>安全提示：</strong></p>
        <ul style="margin:0;padding-left:20px;color:#666;font-size:12px">
          <li>如果你没有请求验证邮箱，请忽略此邮件。</li>
          <li>此验证码和链接仅可使用一次，有效期为 <strong>30 分钟</strong>。</li>
          <li>请勿将验证码告知他人。</li>
        </ul>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#999">请求时间：${timestamp}</p>
    </div>
  </div>
</body>
</html>`;
  const text = [
    `PortraitPay AI — 邮箱验证`,
    `============================`,
    ``,
    `您好 ${name}，`,
    ``,
    `你的邮箱验证码为：${verificationCode}`,
    ``,
    `访问以下链接验证邮箱（链接有效期 30 分钟）：`,
    `${verifyUrl}`,
    ``,
    `-------------------------------------------`,
    `安全提示：`,
    `- 如果你没有请求验证邮箱，请忽略此邮件。`,
    `- 此验证码和链接仅可使用一次，有效期 30 分钟。`,
    `- 请勿将验证码告知他人。`,
    ``,
    `请求时间：${timestamp}`,
  ].join("\n");
  return { subject: "[PortraitPay AI] 邮箱验证码", html, text };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = SendVerificationSchema.parse(body);
    const { email: emailInput, userId: userIdInput } = validatedData;

    // Find user by email or userId
    let user: { id: string; email: string; emailVerified: boolean; name: string | null } | null = null;

    if (emailInput) {
      user = await prisma.user.findFirst({
        where: { email: emailInput, deletedAt: null },
        select: { id: true, email: true, emailVerified: true, name: true },
      });
    } else if (userIdInput) {
      user = await prisma.user.findFirst({
        where: { id: userIdInput, deletedAt: null },
        select: { id: true, email: true, emailVerified: true, name: true },
      });
    }

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[SEND_VERIFICATION] No user found for email: ${emailInput} or userId: ${userIdInput}`);
      return NextResponse.json(
        { success: true, message: "Verification email sent if account exists." },
        { status: 200 }
      );
    }

    // If already verified, no need to send again
    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: "邮箱已验证，无需再次发送" },
        { status: 200 }
      );
    }

    // Generate 6-digit verification code
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const verificationExpires = new Date(Date.now() + VERIFY_CODE_EXPIRY_MS);

    // Store code on user
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationExpires },
    });

    // Build verify URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://portraitpayai.com";
    const verifyUrl = `${baseUrl}/verify-email?code=${verificationCode}&userId=${user.id}`;

    // Build and send email
    const { subject, html, text } = buildVerificationEmailHtml({
      name: user.name ?? user.email.split("@")[0],
      email: user.email,
      verifyUrl,
      verificationCode,
    });

    try {
      await sendSmtpEmail({ to: user.email, subject, html, text });
      console.log(`[SEND_VERIFICATION] Verification email sent to: ${user.email}, code: ${verificationCode}`);
    } catch (emailError) {
      console.error("[SEND_VERIFICATION] Failed to send email:", emailError);
      // Still return success to prevent enumeration
    }

    return NextResponse.json(
      { success: true, message: "Verification email sent if account exists." },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }
    console.error("[SEND_VERIFICATION] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
