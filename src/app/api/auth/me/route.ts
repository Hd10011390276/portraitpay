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

  return NextResponse.json({
    success: true,
    data: { user: session },
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
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    response.cookies.delete("pp_access_token");
    response.cookies.delete("pp_refresh_token");

    return response;
  } catch (err) {
    console.error("[DELETE /api/auth/me]", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    );
  }
}