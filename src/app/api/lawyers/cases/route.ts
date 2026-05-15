/**
 * GET /api/lawyers/cases — 律师查看自己的案件列表
 * POST /api/lawyers/cases — 管理员为律师创建案件（assign lawyer to case）
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET — 律师查看自己的案件
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const lawyer = await prisma.lawyerRegistration.findFirst({
    where: { contactEmail: session.email, status: "APPROVED" },
  });
  if (!lawyer) return NextResponse.json({ success: false, error: "Not an approved lawyer" }, { status: 403 });

  const cases = await prisma.lawyerCase.findMany({
    where: { lawyerRegistrationId: lawyer.id },
    include: {
      infringementReport: {
        include: {
          reporter: { select: { displayName: true, email: true } },
          portrait: { select: { title: true } }
        }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: cases });
}

// POST — 管理员创建律师案件（assign lawyer）
const CreateSchema = z.object({
  infringementReportId: z.string(),
  lawyerRegistrationId: z.string(),
  description: z.string().optional(),
  compensation: z.number().optional(),
  lawyerFeeRate: z.number().optional(),
  platformFeeRate: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "VERIFIER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });

  const { infringementReportId, lawyerRegistrationId, description, compensation, lawyerFeeRate, platformFeeRate } = parsed.data;

  // 检查案件是否已存在（每个侵权报告只能有一个律师案件）
  const existing = await prisma.lawyerCase.findUnique({ where: { infringementReportId } });
  if (existing) return NextResponse.json({ success: false, error: "Case already exists for this report" }, { status: 409 });

  const rate = lawyerFeeRate ?? 0.20;
  const platformRate = platformFeeRate ?? 0.10;
  const comp = compensation ?? 0;
  const pf = Math.round(comp * platformRate * 100) / 100;
  const lf = Math.round((comp - pf) * rate * 100) / 100;
  const pop = Math.round((comp - pf - lf) * 100) / 100;

  const lawyerCase = await prisma.lawyerCase.create({
    data: {
      infringementReportId,
      lawyerRegistrationId,
      description,
      compensation: comp,
      platformFee: pf,
      lawyerFee: lf,
      portraitOwnerPayout: pop,
      lawyerFeeRate: rate,
      platformFeeRate: platformRate,
      status: "PENDING",
      platformConfirmed: false,
    },
  });

  return NextResponse.json({ success: true, data: lawyerCase }, { status: 201 });
}