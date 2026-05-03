/**
 * Revenue Service
 * Handles revenue calculation, split, and settlement logic
 */

import { prisma } from "@/lib/prisma";
import {
  PLATFORM_FEE_RATE,
  OWNER_SPLIT_RATE,
  MIN_WITHDRAWAL_AMOUNT,
  type RevenueSplit,
  type EarningsSummary,
} from "./types";

// ─── Revenue Split Calculation ──────────────────────────────────────────────

/**
 * Calculate revenue split for a given gross amount
 * @param grossAmount - Total transaction amount
 * @returns RevenueSplit with platform fee and owner revenue
 */
export function calculateSplit(grossAmount: number): RevenueSplit {
  const gross = grossAmount;
  const platformFee = Math.round(gross * PLATFORM_FEE_RATE * 100) / 100;
  const ownerRevenue = Math.round(gross * OWNER_SPLIT_RATE * 100) / 100;
  return { gross, platformFee, ownerRevenue };
}

// ─── Create Transaction (on authorization payment) ──────────────────────────

export type CreateTransactionInput = {
  userId: string;
  type: "LICENSE_PURCHASE" | "LICENSE_RENEWAL" | "ROYALTY_PAYOUT";
  amount: number;
  currency?: string;
  authorizationId?: string;
  metadata?: Record<string, unknown>;
  stripePaymentIntentId?: string;
  portraitOwnerId?: string; // 肖像所有者（收款方）
};

/**
 * Create a completed revenue transaction and record platform commission
 * Called after Stripe payment succeeds
 */
export async function createRevenueTransaction(input: CreateTransactionInput) {
  const {
    userId,          // 付款方
    type,
    amount,
    currency = "CNY",
    authorizationId,
    metadata,
    stripePaymentIntentId,
    portraitOwnerId, // 肖像所有者 = 收款方
  } = input;

  const split = calculateSplit(amount);

  // 1. Create main transaction (as the "received" amount for owner)
  // If portraitOwnerId is provided, create transaction for owner
  const ownerTransaction = portraitOwnerId
    ? await prisma.transaction.create({
        data: {
          userId: portraitOwnerId,
          type: "ROYALTY_PAYOUT",
          status: "COMPLETED",
          amount: split.ownerRevenue,
          currency,
          authorizationId,
          stripePaymentIntentId,
          metadata: {
            ...metadata,
            grossAmount: split.gross,
            platformFee: split.platformFee,
            splitRate: `${OWNER_SPLIT_RATE * 100}%`,
            payerUserId: userId,
          },
        },
      })
    : null;

  // 2. Create platform commission transaction
  await prisma.transaction.create({
    data: {
      userId, // platform system user (could be admin or a system record)
      type: "PLATFORM_COMMISSION",
      status: "COMPLETED",
      amount: split.platformFee,
      currency,
      authorizationId,
      stripePaymentIntentId,
      metadata: {
        ...metadata,
        grossAmount: split.gross,
        ownerRevenue: split.ownerRevenue,
        splitRate: `${PLATFORM_FEE_RATE * 100}%`,
        relatedTransactionId: ownerTransaction?.id,
        payerUserId: userId,
        portraitOwnerId,
      },
    },
  });

  return ownerTransaction;
}

// ─── Earnings Summary ────────────────────────────────────────────────────────

/**
 * Get earnings summary for a user (as portrait owner receiving royalties)
 */
export async function getEarningsSummary(userId: string, currency = "CNY"): Promise<EarningsSummary> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // All completed royalty payouts to this user
  const allTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "ROYALTY_PAYOUT",
      status: "COMPLETED",
      currency,
    },
    select: { amount: true, createdAt: true },
  });

  const totalRevenue = allTransactions.reduce(
    (sum, t) => sum + t.amount.toNumber(),
    0
  );

  const monthRevenue = allTransactions
    .filter((t) => t.createdAt >= monthStart)
    .reduce((sum, t) => sum + t.amount.toNumber(), 0);

  // Pending: completed but not yet in a settled withdrawal
  const pendingRevenue = await getPendingSettlementRevenue(userId, currency);

  // Available: net balance minus already withdrawn
  const availableBalance = Math.max(0, totalRevenue - await getWithdrawnAmount(userId, currency));

  const totalWithdrawals = await prisma.withdrawal.aggregate({
    where: { userId, status: "COMPLETED" },
    _sum: { amount: true },
  });

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    monthRevenue: Math.round(monthRevenue * 100) / 100,
    pendingRevenue: Math.round(pendingRevenue * 100) / 100,
    availableBalance: Math.round(availableBalance * 100) / 100,
    totalWithdrawals: totalWithdrawals._sum.amount?.toNumber() ?? 0,
    currency,
  };
}

async function getPendingSettlementRevenue(userId: string, currency: string): Promise<number> {
  const pending = await prisma.withdrawal.findMany({
    where: { userId, status: "PENDING", currency },
    select: { amount: true },
  });
  return pending.reduce((sum, w) => sum + w.amount.toNumber(), 0);
}

async function getWithdrawnAmount(userId: string, currency: string): Promise<number> {
  const result = await prisma.withdrawal.aggregate({
    where: { userId, status: "COMPLETED", currency },
    _sum: { amount: true },
  });
  return result._sum.amount?.toNumber() ?? 0;
}

// ─── Get Earnings Transactions ───────────────────────────────────────────────

export async function getEarningsTransactions(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    type?: string;
  } = {}
) {
  const { page = 1, limit = 20, startDate, endDate, type } = options;

  const where: Record<string, unknown> = {
    userId,
    type: { in: ["ROYALTY_PAYOUT", "LICENSE_PURCHASE"] },
    status: "COMPLETED",
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        authorization: {
          include: {
            portrait: {
              select: { id: true, title: true, ownerId: true, thumbnailUrl: true },
            },
            grantee: { select: { id: true, displayName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      amount: t.amount.toNumber(),
      currency: t.currency,
      createdAt: t.createdAt,
      metadata: t.metadata as Record<string, unknown> | null,
      portrait: t.authorization?.portrait
        ? {
            id: t.authorization.portrait.id,
            title: t.authorization.portrait.title,
            thumbnailUrl: t.authorization.portrait.thumbnailUrl,
          }
        : null,
      granteeName: t.authorization?.grantee?.displayName ?? "Unknown",
      grossAmount: (t.metadata as Record<string, unknown>)?.grossAmount as number | null,
      platformFee: (t.metadata as Record<string, unknown>)?.platformFee as number | null,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Withdrawal Validation ────────────────────────────────────────────────────

export type WithdrawalValidation = {
  valid: boolean;
  error?: string;
};

/**
 * Validate withdrawal request
 */
export async function validateWithdrawal(
  userId: string,
  amount: number,
  currency = "CNY"
): Promise<WithdrawalValidation> {
  if (amount < MIN_WITHDRAWAL_AMOUNT) {
    return {
      valid: false,
      error: `最低提现金额为 ¥${MIN_WITHDRAWAL_AMOUNT}`,
    };
  }

  const summary = await getEarningsSummary(userId, currency);

  if (amount > summary.availableBalance) {
    return {
      valid: false,
      error: `可提现余额不足，当前可提现 ¥${summary.availableBalance.toFixed(2)}`,
    };
  }

  // Check for pending withdrawals
  const pendingCount = await prisma.withdrawal.count({
    where: { userId, status: { in: ["PENDING", "PROCESSING"] } },
  });

  if (pendingCount > 0) {
    return {
      valid: false,
      error: "您有待处理的提现申请，请等待处理完成后再申请",
    };
  }

  // Check settlement period (1st-5th of each month)
  const now = new Date();
  const day = now.getDate();
  if (day >= 1 && day <= 5) {
    return {
      valid: false,
      error: "每月1日至5日为对账周期，暂停提现申请，请稍后再试",
    };
  }

  return { valid: true };
}

// ─── Monthly Settlement Generation ──────────────────────────────────────────

/**
 * Generate monthly settlement for a user
 * Called by a cron job on the 1st of each month
 */
export async function generateMonthlySettlement(userId: string) {
  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 1); // Last day of last month
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1);

  // Check if settlement already exists for this period
  const existing = await prisma.settlement.findFirst({
    where: { userId, periodStart, periodEnd },
  });

  if (existing) {
    return { settlement: existing, created: false };
  }

  // Aggregate transactions for the period
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "ROYALTY_PAYOUT",
      status: "COMPLETED",
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    include: {
      authorization: {
        include: { portrait: { select: { id: true, title: true } } },
      },
    },
  });

  const grossRevenue = transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
  const split = calculateSplit(grossRevenue);

  // Group by portrait for breakdown
  const byPortrait: Record<string, { count: number; revenue: number }> = {};
  for (const t of transactions) {
    const pid = t.authorization?.portrait?.id ?? "unknown";
    const title = t.authorization?.portrait?.title ?? "Unknown";
    if (!byPortrait[pid]) byPortrait[pid] = { count: 0, revenue: 0 };
    byPortrait[pid].count++;
    byPortrait[pid].revenue += t.amount.toNumber();
  }

  const breakdown = Object.entries(byPortrait).map(([portraitId, data]) => {
    const s = calculateSplit(data.revenue);
    return {
      portraitId,
      portraitTitle: transactions.find(
        (t) => t.authorization?.portrait?.id === portraitId
      )?.authorization?.portrait?.title ?? "Unknown",
      transactionCount: data.count,
      grossRevenue: Math.round(data.revenue * 100) / 100,
      platformFee: Math.round(s.platformFee * 100) / 100,
      netRevenue: Math.round(s.ownerRevenue * 100) / 100,
    };
  });

  const settlement = await prisma.settlement.create({
    data: {
      userId,
      periodStart,
      periodEnd,
      grossRevenue: split.gross,
      platformFee: split.platformFee,
      netRevenue: split.ownerRevenue,
      withdrawnAmount: 0,
      pendingAmount: 0,
      availableAmount: split.ownerRevenue,
      currency: "CNY",
      status: "COMPLETED",
      breakdown,
      settledAt: now,
    },
  });

  return { settlement, created: true };
}
