/**
 * GET /api/lawyers/cases/[id] — 律师查看案件详情
 * PATCH /api/lawyers/cases/[id] — 律师更新案件（状态、description、platformConfirmed）
 * DELETE /api/lawyers/cases/[id] — 律师删除案件
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { deleteCase } from "@/lib/cases/deleteCase";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lawyerCase = await prisma.lawyerCase.findUnique({
    where: { id },
    include: {
      infringementReport: {
        include: {
          reporter: { select: { displayName: true, email: true } },
          portrait: { select: { title: true, thumbnailUrl: true } }
        }
      },
      lawyerRegistration: {
        select: { companyName: true, contactName: true, contactEmail: true, region: true }
      }
    },
  });

  if (!lawyerCase) return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });

  // 验证律师身份
  const lawyer = await prisma.lawyerRegistration.findFirst({
    where: { contactEmail: session.email, status: "APPROVED" },
  });

  const isLawyer = lawyer?.id === lawyerCase.lawyerRegistrationId;
  const isAdmin = session.role === "ADMIN" || session.role === "VERIFIER";

  if (!isLawyer && !isAdmin) return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });

  return NextResponse.json({ success: true, data: lawyerCase });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const lawyerCase = await prisma.lawyerCase.findUnique({ where: { id } });
  if (!lawyerCase) return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });

  // 验证律师身份
  const lawyer = await prisma.lawyerRegistration.findFirst({
    where: { contactEmail: session.email, status: "APPROVED" },
  });

  const isLawyer = lawyer?.id === lawyerCase.lawyerRegistrationId;
  const isAdmin = session.role === "ADMIN" || session.role === "VERIFIER";

  if (!isLawyer && !isAdmin) return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });

  // 律师可更新的字段：description、status（从 IN_PROGRESS 改为 WON/LOST）
  // compensation/lawyerFee/platformFee 等由管理员填，律师不可改
  const updateData: Record<string, unknown> = {};

  if (isAdmin || isLawyer) {
    if (typeof body.description === "string") updateData.description = body.description;
  }

  // 状态更新（律师可以更新：IN_PROGRESS → WON/LOST）
  if (body.status && isLawyer) {
    const validTransitions: Record<string, string[]> = {
      IN_PROGRESS: ["WON", "LOST"],
      PENDING: ["IN_PROGRESS"], // 平台确认后会改为 IN_PROGRESS
    };
    const allowed = validTransitions[lawyerCase.status] || [];
    if (allowed.includes(body.status)) {
      updateData.status = body.status;
    }
  }

  // 管理员可以确认案件（开启 platformConfirmed）
  if (isAdmin && body.platformConfirmed === true) {
    updateData.platformConfirmed = true;
    if (lawyerCase.status === "PENDING") {
      updateData.status = "IN_PROGRESS";
    }
  }

  // 管理员可以关闭案件
  if (isAdmin && body.closedAt) {
    updateData.closedAt = new Date(body.closedAt);
    updateData.resolutionNotes = body.resolutionNotes || null;
  }

  const updated = await prisma.lawyerCase.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lawyerCase = await prisma.lawyerCase.findUnique({
    where: { id },
    include: { infringementReport: { select: { id: true } } },
  });
  if (!lawyerCase) return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });

  const lawyer = await prisma.lawyerRegistration.findFirst({
    where: { userId: session.userId, status: "APPROVED" },
  });

  const isOwner = lawyer?.id === lawyerCase.lawyerRegistrationId;
  const isAdmin = session.role === "ADMIN" || session.role === "VERIFIER";

  if (!isOwner && !isAdmin) return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });

  const result = await deleteCase(id);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}