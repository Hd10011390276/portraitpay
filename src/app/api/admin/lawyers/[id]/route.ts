/**
 * PATCH /api/admin/lawyers/[id]
 * 管理员审核律师楼申请
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const registration = await prisma.lawyerRegistration.findUnique({ where: { id } });
    if (!registration) {
      return NextResponse.json({ success: false, error: "申请不存在" }, { status: 404 });
    }

    const updated = await prisma.lawyerRegistration.update({
      where: { id },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewerId: session.userId,
        reviewedAt: new Date(),
        rejectionReason: action === "REJECT" ? (rejectionReason || null) : null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[/api/admin/lawyers/[id] PATCH]", err);
    return NextResponse.json({ success: false, error: "服务器内部错误" }, { status: 500 });
  }
}