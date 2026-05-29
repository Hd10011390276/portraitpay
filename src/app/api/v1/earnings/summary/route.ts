import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const [totalTx, completedTx, portraitCount] = await Promise.all([
    prisma.transaction.count({ where: { userId: session.userId } }),
    prisma.transaction.count({ where: { userId: session.userId, status: "COMPLETED" } }),
    prisma.portrait.count({ where: { ownerId: session.userId, status: "ACTIVE", deletedAt: null } }),
  ]);

  const completed = await prisma.transaction.findMany({
    where: { userId: session.userId, status: "COMPLETED" },
    select: { amount: true, currency: true },
  });

  const totalEarnings = completed.reduce((sum, t) => sum + Number(t.amount), 0);

  return NextResponse.json({
    success: true,
    data: {
      totalTransactions: totalTx,
      completedTransactions: completedTx,
      totalEarnings,
      certifiedPortraits: portraitCount,
    },
  });
}