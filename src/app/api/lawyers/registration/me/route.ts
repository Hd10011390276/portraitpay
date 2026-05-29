/**
 * GET /api/lawyers/registration/me — Get current user's own LawyerRegistration record
 * Requires LAWYER role authentication
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reg = await prisma.lawyerRegistration.findFirst({
      where: { userId: session.userId },
    });

    if (!reg) {
      return NextResponse.json({ success: false, error: "No lawyer registration found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: reg });
  } catch (err) {
    console.error("[GET /api/lawyers/registration/me]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { minCaseFee, hourlyRate, retainerFee, successFeeRate } = body;

    const updateData: any = {};
    if (minCaseFee !== undefined) updateData.minCaseFee = minCaseFee;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (retainerFee !== undefined) updateData.retainerFee = retainerFee;
    if (successFeeRate !== undefined) updateData.successFeeRate = successFeeRate;

    const updated = await prisma.lawyerRegistration.updateMany({
      where: { userId: session.userId },
      data: updateData,
    });

    const reg = await prisma.lawyerRegistration.findFirst({
      where: { userId: session.userId },
    });

    return NextResponse.json({ success: true, data: reg });
  } catch (err) {
    console.error("[PATCH /api/lawyers/registration/me]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}