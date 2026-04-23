/**
 * GET /api/admin/lawyers
 * 管理员查看律师楼入驻申请列表
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    // Check admin role
    if (session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where = status === "ALL" ? {} : { status };
    const [total, registrations] = await Promise.all([
      prisma.lawyerRegistration.count({ where }),
      prisma.lawyerRegistration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        page,
        pageSize,
        registrations,
      },
    });
  } catch (err) {
    console.error("[/api/admin/lawyers GET]", err);
    return NextResponse.json({ success: false, error: "服务器内部错误" }, { status: 500 });
  }
}