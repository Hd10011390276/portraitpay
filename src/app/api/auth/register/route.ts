
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/auth/schemas";
import { signTokenPair } from "@/lib/auth/edge-jwt";
import { setTokenCookies } from "@/lib/auth/session";
import { sendWelcomeEmail } from "@/lib/email";
export const dynamic = "force-dynamic";

type UserRole = string;

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

// ─── Verification Email Template ───────────────────────────────────────────────
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
      <h2 style="margin:0;color:#fff;font-size:18px">验证你的邮箱地址</h2>
      <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">PortraitPay AI · 邮箱验证</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;color:#333;font-size:15px">
        您好 <strong>${name}</strong>，
      </p>
      <p style="margin:0 0 24px;color:#333;font-size:15px">
        感谢你注册 PortraitPay AI！你的邮箱验证码为：
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
          <li>如果你没有注册 PortraitPay AI，请忽略此邮件。</li>
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
    `感谢你注册 PortraitPay AI！你的邮箱验证码为：${verificationCode}`,
    ``,
    `访问以下链接验证邮箱（链接有效期 30 分钟）：`,
    `${verifyUrl}`,
    ``,
    `-------------------------------------------`,
    `安全提示：`,
    `- 如果你没有注册 PortraitPay AI，请忽略此邮件。`,
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
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "表单验证失败",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name, role, phone, allowLicensing, allowedScopes, prohibitedContent, mediaKitUrl, mediaKitShareConfirmed, mediaKitReviewOnlyAcknowledged, mediaKitVisibility } = parsed.data;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "该邮箱已注册" },
        { status: 409 }
      );
    }

    // If phone provided, check uniqueness
    if (phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) {
        return NextResponse.json(
          { success: false, message: "该手机号已被使用" },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        name,
        passwordHash: hashedPassword,
        role: role as UserRole,
        walletAddress: null, // User binds their own wallet on-demand, not at registration
        mediaKitUrl: (mediaKitUrl && mediaKitUrl.trim() !== "") ? mediaKitUrl.trim() : null,
        mediaKitShareConfirmed: mediaKitShareConfirmed ?? false,
        mediaKitReviewOnlyAcknowledged: mediaKitReviewOnlyAcknowledged ?? false,
        mediaKitVisibility: mediaKitVisibility ?? "PRIVATE",
        portraitSettings: {
          create: {
            allowLicensing: allowLicensing ?? true,
            allowedScopes: allowedScopes ?? [],
            prohibitedContent: prohibitedContent ?? [],
          },
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Send welcome email (non-blocking — don't fail registration if email throws)
    try {
      console.log("[REGISTER] Attempting to send welcome email to:", user.email);
      await sendWelcomeEmail({ email: user.email, name: user.name ?? user.email.split("@")[0], role: user.role });
      console.log("[REGISTER] Welcome email sent successfully for:", user.email);
    } catch (emailError) {
      console.error("[REGISTER] Welcome email failed:", emailError);
    }

    // Send email verification email with 6-digit code (non-blocking)
    try {
      const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
      const verificationExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode, verificationExpires },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://portraitpayai.com";
      const verifyUrl = `${baseUrl}/verify-email?code=${verificationCode}&userId=${user.id}`;

      const { subject, html, text } = buildVerificationEmailHtml({
        name: user.name ?? user.email.split("@")[0],
        email: user.email,
        verifyUrl,
        verificationCode,
      });

      await sendSmtpEmail({
        to: user.email,
        subject,
        html,
        text,
      });
      console.log("[REGISTER] Verification email sent to:", user.email, "code:", verificationCode);
    } catch (emailError) {
      console.error("[REGISTER] Verification email failed:", emailError);
    }

    const tokens = await signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const cookieOptions =
      "httpOnly; sameSite=lax; path=/; max-age=86400; secure";

    const response = NextResponse.json(
      {
        success: true,
        message: "注册成功",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      },
      { status: 201 }
    );

    response.cookies.set(
      setTokenCookies(tokens.accessToken, tokens.refreshToken).accessTokenCookie,
      tokens.accessToken,
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 15, secure: process.env.NODE_ENV === "production" }
    );
    response.cookies.set(
      setTokenCookies(tokens.accessToken, tokens.refreshToken).refreshTokenCookie,
      tokens.refreshToken,
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production" }
    );

    return response;
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    const message = error instanceof Error ? error.message : String(error);
    console.error("[REGISTER_ERROR] Details:", message);
    return NextResponse.json(
      { success: false, message: "服务器错误，请稍后重试", debug: message },
      { status: 500 }
    );
  }
}
