
/**
 * POST /api/auth/forgot-password — Send password reset email
 * Body: { email }
 *
 * Environment variables required:
 * - SMTP_HOST: SMTP server host (e.g., smtp.exmail.qq.com)
 * - SMTP_PORT: SMTP server port (e.g., 465 for SSL, 587 for TLS)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASS: SMTP password
 * - SMTP_FROM: Sender email address
 * - APP_URL: Application URL for reset links (e.g., https://portraitpayai.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// In-memory rate limiter: 3 attempts per IP per 10 minutes
const forgotRateLimitMap = new Map<string, { count: number; resetAt: number }>();


// Zod schema for forgot password validation
const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Token expiry time in milliseconds (1 hour)
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

// Nodemailer email sender (same pattern as contact route)
async function sendSmtpEmail(options: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  let nodemailer: typeof import("nodemailer") | null = null;
  try {
    nodemailer = await import("nodemailer");
  } catch {
    throw new Error(
      "nodemailer is not installed. Please run: npm install nodemailer && npm install -D @types/nodemailer"
    );
  }

  const transporter = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth: {
      user: options.user,
      pass: options.pass,
    },
  });

  await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
}

function buildResetPasswordEmailHtml(resetUrl: string, email: string): string {
  const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#7c3aed;padding:20px 24px">
      <h2 style="margin:0;color:#fff;font-size:18px">Password Reset Request</h2>
      <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">PortraitPay AI · Reset Your Password</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;color:#333;font-size:14px">
        We received a request to reset the password for the account associated with <strong>${escapeHtml(email)}</strong>.
      </p>
      <p style="margin:0 0 24px;color:#333;font-size:14px">
        Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
          Reset Password
        </a>
      </div>
      <p style="margin:0 0 16px;color:#666;font-size:13px">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin:0;color:#7c3aed;font-size:12px;word-break:break-all">
        ${escapeHtml(resetUrl)}
      </p>
      <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:8px">
        <p style="margin:0 0 8px;color:#666;font-size:12px">
          <strong>Security Notice:</strong>
        </p>
        <ul style="margin:0;padding-left:20px;color:#666;font-size:12px">
          <li>If you didn't request a password reset, please ignore this email.</li>
          <li>This link can only be used once and will expire after 1 hour.</li>
          <li>Never share this link with anyone.</li>
        </ul>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#999">Requested: ${timestamp}</p>
    </div>
  </div>
</body>
</html>`;
}

function buildResetPasswordEmailText(resetUrl: string, email: string): string {
  return [
    `PortraitPay AI — Password Reset Request`,
    `==========================================`,
    ``,
    `We received a request to reset the password for: ${email}`,
    ``,
    `Click the link below to reset your password (expires in 1 hour):`,
    ``,
    `${resetUrl}`,
    ``,
    `-------------------------------------------`,
    `Security Notice:`,
    `- If you didn't request a password reset, please ignore this email.`,
    `- This link can only be used once and will expire after 1 hour.`,
    `- Never share this link with anyone.`,
    ``,
    `Requested: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip") ?? "unknown";
    const now = Date.now();
    const limit = forgotRateLimitMap.get(ip);
    if (limit && limit.count >= 3 && now < limit.resetAt) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }
    if (!limit || now >= limit.resetAt) {
      forgotRateLimitMap.set(ip, { count: 1, resetAt: now + 600000 });
    } else {
      limit.count++;
    }

    // Parse request body
    const body = await req.json();

    // Validate input with Zod
    const validatedData = ForgotPasswordSchema.parse(body);
    const { email } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we show the same message
    if (!user) {
      console.log(`[FORGOT_PASSWORD] No user found for email: ${email}`);
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists, we have sent a password reset link.",
        },
        { status: 200 }
      );
    }

    // Generate reset token using crypto.randomBytes
    const resetToken = randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires,
      },
    });

    console.log(`[FORGOT_PASSWORD] Token generated for user: ${email}, expires: ${resetExpires.toISOString()}`);

    // Get SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT ?? "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;
    const appUrl = process.env.APP_URL;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("[FORGOT_PASSWORD] SMTP environment variables not configured:", {
        hasHost: !!smtpHost,
        hasUser: !!smtpUser,
        hasPass: !!smtpPass,
      });
      // Still return success to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists, we have sent a password reset link.",
        },
        { status: 200 }
      );
    }

    // Build reset URL
    const baseUrl = appUrl || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Determine if using SSL (port 465) or TLS (other ports)
    const secure = smtpPort === 465;

    // Build email content
    const subject = "[PortraitPay AI] Password Reset Request";
    const html = buildResetPasswordEmailHtml(resetUrl, email);
    const text = buildResetPasswordEmailText(resetUrl, email);

    // Send email via SMTP
    try {
      await sendSmtpEmail({
        host: smtpHost,
        port: smtpPort,
        secure,
        user: smtpUser,
        pass: smtpPass,
        to: email,
        from: smtpFrom || smtpUser,
        subject,
        html,
        text,
      });
      console.log(`[FORGOT_PASSWORD] Reset email sent to: ${email}`);
    } catch (emailError) {
      console.error("[FORGOT_PASSWORD] Failed to send reset email:", emailError);
      // Still return success to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists, we have sent a password reset link.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, we have sent a password reset link.",
      },
      { status: 200 }
    );
  } catch (err) {
    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json(
        {
          success: false,
          error: firstError,
        },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error("[FORGOT_PASSWORD] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
