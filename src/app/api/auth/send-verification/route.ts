/**
 * POST /api/auth/send-verification
 *
 * Resend email verification with 6-digit code.
 * Body: { email?: string, userId?: string }
 *
 * Generates a new 6-digit verification code and sends it to the user's email.
 * Non-blocking — does not reveal whether email exists (to prevent enumeration).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
export const dynamic = "force-dynamic";

const SendVerificationSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  userId: z.string().min(1, "User ID is required").optional(),
}).refine((data) => data.email || data.userId, {
  message: "Either email or userId must be provided",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = SendVerificationSchema.parse(body);
    const { email: emailInput, userId: userIdInput } = validatedData;

    // Find user by email or userId (exclude soft-deleted)
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
      console.log(`[SEND_VERIFICATION] No active user found for email: ${emailInput} or userId: ${userIdInput}`);
      return NextResponse.json(
        { success: true, message: "Verification email sent if account exists." },
        { status: 200 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: "Email already verified, no need to resend" },
        { status: 200 }
      );
    }

    // Send verification email using shared module
    const result = await sendVerificationEmail({
      userId: user.id,
      email: user.email,
      name: user.name ?? user.email.split("@")[0],
      prisma,
    });

    if (!result.sent) {
      console.error(`[SEND_VERIFICATION] Failed to send to ${user.email}:`, result.error);
      // Still return 200 to prevent enumeration
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
