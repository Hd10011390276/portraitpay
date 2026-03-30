/**
 * POST /api/v1/admin/settlements/generate
 * Admin: Trigger monthly settlement for a specific user (or all users)
 *
 * In production this would be called by a cron job on the 1st of each month.
 * Body: { userId?: string } — if userId omitted, generates for all active users
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { generateMonthlySettlement } from "@/lib/revenue/service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    // Log admin action
    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        targetType: "Settlement",
        targetId: userId ?? "all",
        action: "SETTLEMENT_GENERATE",
        before: undefined,
        after: { triggeredAt: new Date().toISOString(), targetUserId: userId ?? "all" },
      },
    });

    if (userId) {
      // Generate for single user
      const { settlement, created } = await generateMonthlySettlement(userId);
      return NextResponse.json({
        success: true,
        data: { settlement, created },
        message: created ? "结算单已生成" : "本月结算单已存在",
      });
    }

    // Generate for all active users with royalty transactions
    const userIds = await prisma.transaction.findMany({
      where: {
        type: "ROYALTY_PAYOUT",
        status: "COMPLETED",
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      distinct: ["userId"],
      select: { userId: true },
    });

    const results = await Promise.allSettled(
      userIds.map(({ userId: uid }) => generateMonthlySettlement(uid))
    );

    const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.created).length;
    const skipped = results.filter((r) => r.status === "fulfilled" && !r.value.created).length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      data: {
        total: userIds.length,
        settled: succeeded,
        skipped,
        failed,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/admin/settlements/generate]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
