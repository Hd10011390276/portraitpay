/**
 * GET /api/v1/settlements
 * List user's monthly settlement records
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where: { userId: session.userId },
        orderBy: { periodEnd: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.settlement.count({ where: { userId: session.userId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: settlements.map((s) => ({
        id: s.id,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
        grossRevenue: s.grossRevenue.toNumber(),
        platformFee: s.platformFee.toNumber(),
        netRevenue: s.netRevenue.toNumber(),
        withdrawnAmount: s.withdrawnAmount.toNumber(),
        pendingAmount: s.pendingAmount.toNumber(),
        availableAmount: s.availableAmount.toNumber(),
        currency: s.currency,
        status: s.status,
        breakdown: s.breakdown,
        settledAt: s.settledAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/settlements]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
