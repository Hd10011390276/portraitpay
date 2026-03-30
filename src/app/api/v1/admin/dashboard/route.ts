/**
 * GET /api/v1/admin/dashboard
 * Admin dashboard statistics: user count, transaction volume,
 * pending reviews, active portraits, recent activity
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") ?? "30", 10)));
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Parallel queries
    const [
      totalUsers,
      newUsersThisPeriod,
      kycPendingCount,
      activePortraits,
      totalActivePortraits,
      totalTransactionsThisPeriod,
      totalVolumeThisPeriod,
      pendingEntApps,
      pendingWithdrawals,
      totalRevenueAllTime,
      infringementAlertsOpen,
      recentTransactions,
      topEarningUsers,
    ] = await Promise.all([
      // User stats
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: since }, deletedAt: null } }),

      // KYC pending
      prisma.user.count({ where: { kycStatus: "PENDING", deletedAt: null } }),

      // Portraits
      prisma.portrait.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.portrait.count({ where: { deletedAt: null } }),

      // Transaction stats
      prisma.transaction.count({
        where: { createdAt: { gte: since }, status: "COMPLETED" },
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: since }, status: "COMPLETED", type: { in: ["LICENSE_PURCHASE", "LICENSE_RENEWAL"] } },
        _sum: { amount: true },
      }),

      // Enterprise auth applications pending
      prisma.entAuthApplication.count({ where: { status: "PENDING_PORTRAIT_OWNER" } }),

      // Withdrawals pending
      prisma.withdrawal.count({ where: { status: "PENDING" } }),

      // All-time total revenue (royalties paid out)
      prisma.transaction.aggregate({
        where: { type: "ROYALTY_PAYOUT", status: "COMPLETED" },
        _sum: { amount: true },
      }),

      // Open infringement alerts
      prisma.infringementAlert.count({ where: { status: "PENDING" } }),

      // Recent transactions
      prisma.transaction.findMany({
        where: { status: "COMPLETED" },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Top earning users this period
      prisma.transaction.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: since }, status: "COMPLETED", type: "ROYALTY_PAYOUT" },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
    ]);

    // Resolve top earning users
    const topEarningUserIds = topEarningUsers.map((u) => u.userId);
    const topEarningUserInfos = await prisma.user.findMany({
      where: { id: { in: topEarningUserIds } },
      select: { id: true, displayName: true, email: true },
    });
    const userMap = new Map(topEarningUserInfos.map((u) => [u.id, u]));

    const topEarnings = topEarningUsers.map((u) => ({
      user: userMap.get(u.userId) ?? { id: u.userId, displayName: null, email: null },
      totalRevenue: u._sum.amount?.toNumber() ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        period: { days, since: since.toISOString(), until: new Date().toISOString() },
        users: {
          total: totalUsers,
          newThisPeriod: newUsersThisPeriod,
          kycPending: kycPendingCount,
        },
        portraits: {
          total: totalActivePortraits,
          active: activePortraits,
        },
        transactions: {
          countThisPeriod: totalTransactionsThisPeriod,
          volumeThisPeriod: totalVolumeThisPeriod._sum.amount?.toNumber() ?? 0,
        },
        pending: {
          enterpriseAuthApplications: pendingEntApps,
          withdrawals: pendingWithdrawals,
          infringementAlerts: infringementAlertsOpen,
        },
        revenue: {
          allTime: totalRevenueAllTime._sum.amount?.toNumber() ?? 0,
        },
        topEarningUsers: topEarnings,
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount.toNumber(),
          currency: t.currency,
          createdAt: t.createdAt,
          user: t.user,
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/admin/dashboard]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
