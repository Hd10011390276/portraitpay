/**
 * GET  /api/v1/withdrawals     - List user's withdrawal applications
 * POST /api/v1/withdrawals     - Create a new withdrawal application
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { validateWithdrawal } from "@/lib/revenue/service";
import { MIN_WITHDRAWAL_AMOUNT } from "@/lib/revenue/types";

const CreateWithdrawalSchema = z.object({
  amount: z.number().positive(`最低提现金额为 ¥${MIN_WITHDRAWAL_AMOUNT}`),
  currency: z.string().default("CNY"),
  bankName: z.string().min(1, "请填写银行名称"),
  bankAccount: z.string().min(1, "请填写银行账号"),
  accountHolder: z.string().min(1, "请填写开户姓名"),
});

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.userId };
    if (status) where.status = status;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
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
        createdAt: w.createdAt,
        processedAt: w.processedAt,
        completedAt: w.completedAt,
        stripeTransferId: w.stripeTransferId,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/withdrawals]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateWithdrawalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, currency, bankName, bankAccount, accountHolder } = parsed.data;

    // Validate withdrawal eligibility
    const validation = await validateWithdrawal(session.userId, amount, currency);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Create withdrawal application
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: session.userId,
        amount,
        currency,
        bankName,
        bankAccountLast4: bankAccount.slice(-4),
        accountHolder,
        status: "PENDING",
        // bankAccount full is encrypted in production — store hashed
      },
    });

    return NextResponse.json(
      { success: true, data: withdrawal },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/v1/withdrawals]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
