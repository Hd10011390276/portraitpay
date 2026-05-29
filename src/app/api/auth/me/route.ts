/**
 * GET /api/auth/me — Get current session
 * DELETE /api/auth/me — Soft-delete the authenticated user's account
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check available account types for role switching
  const [agencyAccount, lawyerRegistration] = await Promise.all([
    prisma.agencyAccount.findUnique({ where: { userId: session.userId }, select: { id: true, status: true } }),
    prisma.lawyerRegistration.findFirst({
      where: { userId: session.userId, status: "APPROVED" },
      select: { id: true, status: true },
    }),
  ]);

  const availableRoles: string[] = ["USER"];
  if (agencyAccount) availableRoles.push("AGENCY");
  if (lawyerRegistration) availableRoles.push("LAWYER");

  return NextResponse.json({
    success: true,
    data: {
      user: session,
      availableRoles: [...new Set(availableRoles)],
    },
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session?.userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { deletedAt: new Date() },
    });

    const response = NextResponse.json({ success: true, message: "Account deleted" });
    response.cookies.set("pp_access_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    response.cookies.set("pp_refresh_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });

    return response;
  } catch (err) {
    console.error("[DELETE /api/auth/me]", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    );
  }
}