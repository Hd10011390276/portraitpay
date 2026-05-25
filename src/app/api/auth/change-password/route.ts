/**
 * POST /api/auth/change-password — Change password for logged-in user
 * Body: { currentPassword, newPassword }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

function isPasswordStrong(password: string): { valid: boolean; message?: string } {
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain at least one uppercase letter" };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must contain at least one lowercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain at least one number" };
  return { valid: true };
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const validatedData = ChangePasswordSchema.safeParse(body);
  if (!validatedData.success) {
    return NextResponse.json({ success: false, error: validatedData.error.issues[0].message }, { status: 400 });
  }

  const { currentPassword, newPassword } = validatedData.data;

  const passwordCheck = isPasswordStrong(newPassword);
  if (!passwordCheck.valid) {
    return NextResponse.json({ success: false, error: passwordCheck.message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true, email: true } });
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  if (!user.passwordHash) {
    return NextResponse.json({ success: false, error: "No password set for this account" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ success: false, error: "New password must be different from current password" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.userId }, data: { passwordHash: newHash } });

  return NextResponse.json({ success: true, message: "Password changed successfully" }, { status: 200 });
}