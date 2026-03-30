/**
 * GET /api/v1/admin/transactions
 * Admin: List all platform transactions with filters
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
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: { select: { id: true, displayName: true, email: true } },
          authorization: {
            include: {
              portrait: { select: { id: true, title: true, ownerId: true } },
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

    return NextResponse.json({
      success: true,
      data: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount.toNumber(),
        currency: t.currency,
        createdAt: t.createdAt,
        user: t.user,
        authorization: t.authorization
          ? {
              id: t.authorization.id,
              portrait: t.authorization.portrait,
              grantee: t.authorization.grantee,
            }
          : null,
        stripePaymentIntentId: t.stripePaymentIntentId,
        metadata: t.metadata,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/admin/transactions]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
