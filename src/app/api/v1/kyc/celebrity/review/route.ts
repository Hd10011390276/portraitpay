/**
 * PATCH /api/v1/kyc/celebrity/review
 * 管理员审核艺人申请
 *
 * Body: { applicationId: string, decision: "APPROVED" | "REJECTED", reason?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { kycService } from "@/lib/kyc/service";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 检查管理员权限
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    if (user?.role !== "ADMIN" && user?.role !== "VERIFIER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, decision, reason } = body;

    if (!applicationId || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { success: false, error: "applicationId and decision (APPROVED|REJECTED) are required" },
        { status: 400 }
      );
    }

    await kycService.reviewCelebrityApplication(
      applicationId,
      session.userId,
      decision,
      reason
    );

    return NextResponse.json({ success: true, data: { message: `Application ${decision.toLowerCase()}` } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
