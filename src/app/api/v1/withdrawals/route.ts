
/**
 * GET  /api/v1/withdrawals     - List user's withdrawal applications
 * POST /api/v1/withdrawals     - Create a new withdrawal application
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, getSessionFromRequest } from "@/lib/auth/session";
import { validateWithdrawal } from "@/lib/revenue/service";
import { MIN_WITHDRAWAL_AMOUNT } from "@/lib/revenue/types";
export const dynamic = "force-dynamic";


const CreateWithdrawalSchema = z.object({
  amount: z.number().positive(`最低提现金额为 ¥${MIN_WITHDRAWAL_AMOUNT}`),
  currency: z.string().default("CNY"),
  paymentMethod: z.enum(["wechat", "alipay", "paypal", "bank"]).default("bank"),
  // For digital wallets
  accountId: z.string().optional(), // WeChat/ Alipay/ PayPal account
  accountName: z.string().optional(), // Account holder name
  // For bank transfer
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  accountHolder: z.string().optional(),
});

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
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
    const session = await getSessionFromRequest(request);
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

    const { amount, currency, paymentMethod, accountId, accountName, bankName, bankAccount, accountHolder } = parsed.data;

    // Get the appropriate fields based on payment method
    const finalAccountId = accountId || "";
    const finalAccountName = accountName || accountHolder || "";
    const finalBankName = bankName || (paymentMethod !== "bank" ? paymentMethod.toUpperCase() : "");
    const finalBankAccount = bankAccount || accountId || "";
    const finalAccountHolder = accountHolder || accountName || "";

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
        bankName: finalBankName,
        bankAccountLast4: finalBankAccount.slice(-4),
        accountHolder: finalAccountHolder,
        status: "PENDING",
        // Store payment method in bankName for digital wallets
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
