/**
 * POST /api/lawyers/cases/[id]/close — 管理员结算案件
 *
 * Body: { resolutionNotes? }
 *
 * - 将 status 改为 CLOSED
 * - 生成 LAWYER_PAYOUT transaction（给律师）
 * - 生成 PORTRAIT_OWNER_PAYOUT transaction（给肖像主）
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "VERIFIER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const lawyerCase = await prisma.lawyerCase.findUnique({
    where: { id },
    include: {
      infringementReport: { select: { reporterId: true } },
    },
  });

  if (!lawyerCase) return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });

  if (!["WON", "LOST"].includes(lawyerCase.status)) {
    return NextResponse.json({ success: false, error: "Case must be WON or LOST before closing" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    status: "CLOSED",
    closedAt: new Date(),
    resolutionNotes: body.resolutionNotes || null,
  };

  // 只有 WON 时才生成 Transaction
  if (lawyerCase.status === "WON") {
    const comp = Number(lawyerCase.compensation);
    const lawyerFee = Number(lawyerCase.lawyerFee);
    const portraitOwnerPayout = Number(lawyerCase.portraitOwnerPayout);

    // Generate lawyer fee payout (use lawyerRegistration.userId, not the registration ID)
    if (lawyerFee > 0) {
      const lawyerReg = await prisma.lawyerRegistration.findUnique({
        where: { id: lawyerCase.lawyerRegistrationId },
        select: { userId: true },
      });
      if (lawyerReg?.userId && lawyerReg.userId !== "") {
        await prisma.transaction.create({
          data: {
            userId: lawyerReg.userId,
            type: "LAWYER_PAYOUT",
            status: "COMPLETED",
            amount: lawyerFee,
            currency: "CNY",
            metadata: {
              lawyerCaseId: lawyerCase.id,
              infringementReportId: lawyerCase.infringementReportId,
              compensation: comp,
            },
          },
        });
      }
    }

    // Generate portrait owner payout (not reporter — reporter may not be the owner)
    if (portraitOwnerPayout > 0) {
      const portrait = await prisma.infringementReport.findUnique({
        where: { id: lawyerCase.infringementReportId },
        select: { portraitId: true },
      });
      const portraitOwnerId = portrait?.portraitId
        ? (await prisma.portrait.findUnique({ where: { id: portrait.portraitId }, select: { ownerId: true } }))?.ownerId
        : null;
      if (portraitOwnerId) {
        await prisma.transaction.create({
          data: {
            userId: portraitOwnerId,
            type: "PORTRAIT_OWNER_PAYOUT",
            status: "COMPLETED",
            amount: portraitOwnerPayout,
            currency: "CNY",
            metadata: {
              lawyerCaseId: lawyerCase.id,
              infringementReportId: lawyerCase.infringementReportId,
              compensation: comp,
            },
          },
        });
      }
    }
  }

  const updated = await prisma.lawyerCase.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, data: updated });
}