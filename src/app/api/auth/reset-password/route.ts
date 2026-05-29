
/**
 * POST /api/auth/reset-password — Reset password using token
 * Body: { token, password }
 *
 * Validates the reset token, hashes the new password with bcryptjs,
 * updates the user's password, and clears the reset token.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// In-memory rate limiter: 3 attempts per IP per 10 minutes
const resetRateLimitMap = new Map<string, { count: number; resetAt: number }>();


// Zod schema for reset password validation
const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

// Password strength validation
function isPasswordStrong(password: string): { valid: boolean; message?: string } {
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  // At least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip") ?? "unknown";
    const now = Date.now();
    const limit = resetRateLimitMap.get(ip);
    if (limit && limit.count >= 3 && now < limit.resetAt) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }
    if (!limit || now >= limit.resetAt) {
      resetRateLimitMap.set(ip, { count: 1, resetAt: now + 600000 });
    } else {
      limit.count++;
    }

    // Parse request body
    const body = await req.json();

    // Validate input with Zod
    const validatedData = ResetPasswordSchema.parse(body);
    const { token, password } = validatedData;

    // Validate password strength
    const passwordCheck = isPasswordStrong(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: passwordCheck.message,
        },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      console.log(`[RESET_PASSWORD] Invalid or expired token attempted`);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired reset token. Please request a new password reset.",
        },
        { status: 400 }
      );
    }

    console.log(`[RESET_PASSWORD] Token valid for user: ${user.email}`);

    // Hash new password with bcryptjs
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
      },
    });

    console.log(`[RESET_PASSWORD] Password successfully reset for user: ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been successfully reset. You can now login with your new password.",
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

    // Handle bcrypt errors
    if (err instanceof Error && err.message.includes("bcrypt")) {
      console.error("[RESET_PASSWORD] Bcrypt error:", err);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process password. Please try again later.",
        },
        { status: 500 }
      );
    }

    // Log unexpected errors
    console.error("[RESET_PASSWORD] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
