/**
 * GET /api/v1/transactions
 * List user's transactions (as payer or recipient)
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
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          authorization: {
            include: {
              portrait: { select: { id: true, title: true, thumbnailUrl: true } },
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
        authorizationId: t.authorizationId,
        portrait: t.authorization?.portrait ?? null,
        metadata: t.metadata,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/transactions]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
