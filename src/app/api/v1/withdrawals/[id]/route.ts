/**
 * GET    /api/v1/withdrawals/[id] - Get withdrawal detail
 * PATCH  /api/v1/withdrawals/[id] - Update withdrawal (user cancel / admin approve/reject)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

const UpdateWithdrawalSchema = z.object({
  action: z.enum(["cancel", "approve", "reject"]),
  reason: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();
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

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
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

        // TODO: Trigger Stripe payout (async, 1-3 business days)
        // await initiateStripePayout({ withdrawalId: id, ... });
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
