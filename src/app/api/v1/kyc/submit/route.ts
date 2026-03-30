/**
 * POST /api/v1/kyc/submit
 * 提交 KYC 资料（身份证照片 + 人脸照）
 */
import { NextRequest, NextResponse } from "next/server";
import { kycService } from "@/lib/kyc/service";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { level, idCardFrontUrl, idCardBackUrl, faceImageUrl } = body;

    if (!idCardFrontUrl) {
      return NextResponse.json(
        { success: false, error: "idCardFrontUrl is required" },
        { status: 400 }
      );
    }

    await kycService.submit(session.userId, {
      level: level ?? 2,
      idCardFrontUrl,
      idCardBackUrl,
      faceImageUrl,
    });

    return NextResponse.json({
      success: true,
      data: { message: "KYC submitted, pending review" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "KYC submit failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
