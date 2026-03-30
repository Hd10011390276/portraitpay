/**
 * POST   /api/v1/kyc/celebrity        — 提交艺人申请
 * GET    /api/v1/kyc/celebrity        — 查询申请状态
 * PATCH  /api/v1/kyc/celebrity/:id    — 管理员审核
 */
import { NextRequest, NextResponse } from "next/server";
import { kycService } from "@/lib/kyc/service";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

// ─── POST — 提交艺人专项申请 ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      stageName, realName, idCardNumber,
      idCardFrontUrl, idCardBackUrl,
      authLetterUrl, authLetterHash,
      notaryCertUrl, agencyName, agencyContact, agencyPhone,
    } = body;

    // 必填字段校验
    if (!stageName || !realName || !idCardNumber || !idCardFrontUrl || !authLetterUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: stageName, realName, idCardNumber, idCardFrontUrl, authLetterUrl" },
        { status: 400 }
      );
    }

    // 身份证号格式校验（18位）
    if (!/^\d{17}[\dXx]$/.test(idCardNumber)) {
      return NextResponse.json(
        { success: false, error: "Invalid Chinese ID card number" },
        { status: 400 }
      );
    }

    await kycService.submitCelebrityApplication(session.userId, {
      stageName,
      realName,
      idCardNumber,
      idCardFrontUrl,
      idCardBackUrl,
      authLetterUrl,
      authLetterHash,
      notaryCertUrl,
      agencyName,
      agencyContact,
      agencyPhone,
    });

    return NextResponse.json({
      success: true,
      data: { message: "Celebrity application submitted, pending review" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Application failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// ─── GET — 查询艺人申请状态 ─────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const application = await prisma.celebrityApplication.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "No application found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to get application" }, { status: 500 });
  }
}
