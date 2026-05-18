/**
 * PATCH /api/admin/users/[id]
 * SUPER_ADMIN/ADMIN promote or demote user roles
 * Body: { role: string, reason?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "VERIFIER"];
const VALID_ROLES = ["USER", "TALENT", "AGENCY", "ENTERPRISE", "CELEBRITY", "ADMIN", "VERIFIER", "SUPER_ADMIN"];

const ROLE_HIERARCHY: Record<string, number> = {
  USER: 1,
  TALENT: 2,
  AGENCY: 3,
  ENTERPRISE: 4,
  CELEBRITY: 5,
  VERIFIER: 6,
  ADMIN: 7,
  SUPER_ADMIN: 8,
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { role, reason } = body;

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
  }

  // Prevent self-demotion
  if (id === session.userId) {
    return NextResponse.json({ success: false, error: "Cannot change your own role" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true },
  });
  if (!targetUser) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const adminLevel = ROLE_HIERARCHY[session.role] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.role] ?? 0;
  const newLevel = ROLE_HIERARCHY[role] ?? 0;

  // SUPER_ADMIN can set any role
  if (session.role === "SUPER_ADMIN") {
    // ok
  }
  // ADMIN can promote to VERIFIER or demote VERIFIER
  else if (session.role === "ADMIN") {
    if (newLevel > ROLE_HIERARCHY["ADMIN"]) {
      return NextResponse.json({ success: false, error: "Not authorized to set this role" }, { status: 403 });
    }
    if (targetLevel > ROLE_HIERARCHY["ADMIN"]) {
      return NextResponse.json({ success: false, error: "Not authorized to modify this user" }, { status: 403 });
    }
  }
  // VERIFIER cannot do anything here
  else {
    return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, role: true },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      targetType: "USER",
      targetId: id,
      action: "USER_ROLE_CHANGE",
      before: { role: targetUser.role },
      after: { role },
      reason: reason ?? null,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}