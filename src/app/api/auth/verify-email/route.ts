/**
 * POST /api/auth/verify-email — Verify email with 6-digit code + userId
 * Body: { code: string, userId: string }
 *
 * Validates the code from the verification email and sets emailVerified on the user.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
export const dynamic = "force-dynamic";

const VerifyEmailSchema = z.object({
  code: z.string().length(6, "验证码为6位数字"),
  userId: z.string().min(1, "User ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = VerifyEmailSchema.parse(body);
    const { code, userId } = validatedData;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true, verificationCode: true, verificationExpires: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    // If already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: "邮箱已验证" },
        { status: 200 }
      );
    }

    // Check code matches and not expired
    if (user.verificationCode !== code) {
      return NextResponse.json(
        { success: false, error: "验证码错误" },
        { status: 400 }
      );
    }

    if (!user.verificationExpires || user.verificationExpires < new Date()) {
      return NextResponse.json(
        { success: false, error: "验证码已过期，请重新发送验证邮件" },
        { status: 400 }
      );
    }

    // Mark email as verified and clear code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    console.log(`[VERIFY_EMAIL] Email verified for user: ${user.id}`);

    // Send welcome email after successful verification (non-blocking)
    sendWelcomeEmail({ email: user.email, name: user.name ?? user.email.split("@")[0] }).catch((err) => {
      console.error("[VERIFY_EMAIL] Welcome email failed:", err instanceof Error ? err.message : String(err));
    });

    return NextResponse.json(
      { success: true, message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }
    console.error("[VERIFY_EMAIL] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
