/**
 * GET  /api/v1/admin/withdrawals - Admin: List all withdrawal applications
 * PATCH /api/v1/admin/withdrawals/[id] (see withdrawals/[id]/route.ts for detail)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          user: { select: { id: true, displayName: true, email: true, kycStatus: true } },
          settlement: {
            select: { id: true, periodStart: true, periodEnd: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
    ]);

    // Summary stats
    const [pendingCount, totalPendingAmount, totalWithdrawnAmount] = await Promise.all([
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.withdrawal.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: withdrawals.map((w) => ({
        id: w.id,
        amount: w.amount.toNumber(),
        currency: w.currency,
        actualAmount: w.actualAmount?.toNumber() ?? null,
        bankName: w.bankName,
        bankAccountLast4: w.bankAccountLast4,
        accountHolder: w.accountHolder,
        status: w.status,
        rejectionReason: w.rejectionReason,
        stripeTransferId: w.stripeTransferId,
        stripePayoutId: w.stripePayoutId,
        user: w.user,
        settlement: w.settlement,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
        completedAt: w.completedAt,
      })),
      stats: {
        pendingCount,
        totalPendingAmount: totalPendingAmount._sum.amount?.toNumber() ?? 0,
        totalWithdrawnAmount: totalWithdrawnAmount._sum.amount?.toNumber() ?? 0,
      },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/admin/withdrawals]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
