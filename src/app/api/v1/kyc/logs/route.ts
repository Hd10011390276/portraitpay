/**
 * GET /api/v1/kyc/logs
 * 获取当前用户的 KYC 日志（分页）
 *
 * Query: ?page=1&limit=20&userId=xxx (admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { kycService } from "@/lib/kyc/service";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    // 普通用户只能查自己的；管理员可查任意用户
    let userId = session.userId;
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (user?.role === "ADMIN" || user?.role === "VERIFIER") {
      const paramUserId = searchParams.get("userId");
      if (paramUserId) userId = paramUserId;
    }

    const result = await kycService.getLogs(userId, { page, limit });

    return NextResponse.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get logs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
