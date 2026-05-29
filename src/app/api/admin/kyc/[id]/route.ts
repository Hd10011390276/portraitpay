import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["NOT_STARTED", "PENDING", "APPROVED", "REJECTED", "EXPIRED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !["SUPER_ADMIN", "ADMIN", "VERIFIER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { kycStatus, rejectReason } = body;

    if (!kycStatus || !VALID_STATUSES.includes(kycStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, kycStatus: true } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { kycStatus };

    if (kycStatus === "APPROVED") {
      updateData.kycVerifiedAt = new Date();
      const user = await prisma.user.findUnique({ where: { id }, select: { kycLevel: true } });
      if (!user?.kycLevel) updateData.kycLevel = 1;
    }

    await prisma.user.update({ where: { id }, data: updateData });

    try {
      await prisma.kYCLog.create({
        data: {
          userId: id,
          provider: "admin",
          action: kycStatus === "APPROVED" ? "ADMIN_APPROVE" : "ADMIN_REJECT",
          result: kycStatus === "APPROVED" ? "PASS" : "FAIL",
          rejectReason: rejectReason ?? null,
        },
      });
    } catch (logErr) {
      console.error("[PATCH /api/admin/kyc] KYCLog write failed:", logErr);
    }

    return NextResponse.json({ success: true, data: { id, kycStatus } });
  } catch (error) {
    console.error("[PATCH /api/admin/kyc/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
