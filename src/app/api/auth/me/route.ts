/**
 * DELETE /api/auth/me
 *
 * Soft-delete the authenticated user's account.
 * Sets deletedAt timestamp, does not physically remove the record.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    // Clear session cookies
    const response = NextResponse.json({ success: true, message: "Account deleted" });
    response.cookies.get("accessToken") && response.cookies.delete("accessToken");
    response.cookies.get("refreshToken") && response.cookies.delete("refreshToken");

    return response;
  } catch (err) {
    console.error("[DELETE /api/auth/me]", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    );
  }
}