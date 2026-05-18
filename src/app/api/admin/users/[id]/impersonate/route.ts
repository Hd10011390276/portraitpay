/**
 * POST /api/admin/users/[id]/impersonate
 * SUPER_ADMIN only — generate a short-lived token to preview as another user
 * Body: { reason?: string }
 *
 * Security notes:
 * - Tokens should be short-lived (15 min) and single-use
 * - All actions during impersonation should be logged with originalAdminId
 * - UI should show a visible banner during impersonation
 *
 * Implementation status: DESIGN — needs frontend UI work
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { signTokenPair } from "@/lib/auth/edge-jwt";

export const dynamic = "force-dynamic";

// Design for QA impersonation
// 1. SUPER_ADMIN calls POST /api/admin/users/:id/impersonate with reason
// 2. Server verifies session.role === "SUPER_ADMIN"
// 3. Creates impersonation audit log
// 4. Issues a temporary impersonation token with meta: { originalAdminId, impersonatedUserId, impersonating: true }
// 5. Frontend shows yellow banner: "Previewing as user@email (QA mode)"
// 6. All API calls include originalAdminId in X-Impersonating header
// 7. Impersonation token expires in 15 minutes
//
// To implement: add ImpersonationToken model to Prisma schema
// model ImpersonationToken {
//   id            String   @id @default(cuid())
//   adminId       String
//   targetUserId  String
//   token         String   @unique
//   reason        String?
//   expiresAt     DateTime
//   usedAt        DateTime?
//   createdAt     DateTime @default(now())
// }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "SUPER_ADMIN only" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const { reason } = body as { reason?: string };

  if (id === session.userId) {
    return NextResponse.json({ success: false, error: "Cannot impersonate yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // Audit log impersonation
  await prisma.auditLog.create({
    data: {
      adminId: session.userId,
      targetType: "USER",
      targetId: id,
      action: "IMPERSONATION_START",
      reason: reason ?? null,
    },
  });

return NextResponse.json({ success: false, error: "Not Implemented" }, { status: 501 });
}