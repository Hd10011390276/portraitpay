
/**
 * GET    /api/v1/withdrawals/[id] - Get withdrawal detail
 * PATCH  /api/v1/withdrawals/[id] - Update withdrawal (user cancel / admin approve/reject)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, getSessionFromRequest } from "@/lib/auth/session";
import { initiateStripePayout } from "@/lib/payments/stripe";
export const dynamic = "force-dynamic";


const UpdateWithdrawalSchema = z.object({
  action: z.enum(["cancel", "approve", "reject"]),
  reason: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // Users can only view their own; admins can view all
    if (withdrawal.userId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: withdrawal });
  } catch (error) {
    console.error("[GET /api/v1/withdrawals/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UpdateWithdrawalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, reason } = parsed.data;

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    switch (action) {
      case "cancel": {
        // User cancels their own pending withdrawal
        if (withdrawal.userId !== session.userId) {
          return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        if (withdrawal.status !== "PENDING") {
          return NextResponse.json(
            { success: false, error: "只有待处理的提现可以取消" },
            { status: 400 }
          );
        }
        await prisma.withdrawal.update({
          where: { id },
          data: { status: "REJECTED", rejectionReason: "用户主动取消", processedAt: new Date() },
        });
        break;
      }

      case "approve": {
        // Admin approves withdrawal
        if (session.role !== "ADMIN") {
          return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        if (withdrawal.status !== "PENDING") {
          return NextResponse.json(
            { success: false, error: "只有待处理的提现可以审核" },
            { status: 400 }
          );
        }

        // Get user's Stripe customer/connected account ID
        const user = await prisma.user.findUnique({
          where: { id: withdrawal.userId },
          select: { stripeCustomerId: true, email: true },
        });

        if (!user?.stripeCustomerId) {
          return NextResponse.json(
            { success: false, error: "用户未绑定Stripe账户，请先在设置页面绑定Stripe" },
            { status: 400 }
          );
        }

        // Update withdrawal to APPROVED first, then trigger Stripe payout
        await prisma.withdrawal.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: session.userId,
            processedAt: new Date(),
          },
        });

        // Log admin action
        await prisma.auditLog.create({
          data: {
            adminId: session.userId,
            targetType: "Withdrawal",
            targetId: id,
            action: "WITHDRAWAL_APPROVE",
            before: { status: withdrawal.status },
            after: { status: "APPROVED" },
            reason,
          },
        });

        // Trigger Stripe payout (async, 1-3 business days)
        // Using stub mode if STRIPE_STUB=true for development
        try {
          const amountInCents = Math.round(withdrawal.amount.toNumber() * 100);
          await initiateStripePayout({
            withdrawalId: id,
            stripeCustomerId: user.stripeCustomerId,
            amount: amountInCents,
            currency: withdrawal.currency.toLowerCase(),
          });
        } catch (stripeError) {
          console.error("[Stripe Payout Error]", stripeError);
          // Payout failed - revert status to PENDING and log error
          await prisma.withdrawal.update({
            where: { id },
            data: {
              status: "PENDING",
              rejectionReason: `Stripe payout创建失败: ${stripeError instanceof Error ? stripeError.message : "Unknown error"}`,
              processedAt: new Date(),
            },
          });
          return NextResponse.json(
            { success: false, error: "Stripe payout创建失败，请稍后重试" },
            { status: 500 }
          );
        }
        break;
      }

      case "reject": {
        if (session.role !== "ADMIN") {
          return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        if (withdrawal.status !== "PENDING") {
          return NextResponse.json(
            { success: false, error: "只有待处理的提现可以审核" },
            { status: 400 }
          );
        }
        await prisma.withdrawal.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason: reason ?? "审核未通过",
            processedAt: new Date(),
          },
        });

        await prisma.auditLog.create({
          data: {
            adminId: session.userId,
            targetType: "Withdrawal",
            targetId: id,
            action: "WITHDRAWAL_REJECT",
            before: { status: withdrawal.status },
            after: { status: "REJECTED", reason },
            reason,
          },
        });
        break;
      }
    }

    const updated = await prisma.withdrawal.findUnique({ where: { id } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/v1/withdrawals/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
