/**
 * POST /api/portraits/[id]/verify-face
 * 上传肖像后立即做人脸比对（不依赖 KYC approval）
 * 直接调用阿里云 CompareFace API 比对肖像照和身份证照片
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { kycService } from "@/lib/kyc/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: { ownerId: true, originalImageUrl: true, idCardFrontUrl: true },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const portraitImageUrl = body.portraitImageUrl ?? portrait.originalImageUrl;
    const idCardFrontUrl = body.idCardFrontUrl ?? portrait.idCardFrontUrl;

    if (!portraitImageUrl) {
      return NextResponse.json(
        { success: false, error: "请先上传肖像照片", code: "PP-FACE-003" },
        { status: 400 }
      );
    }

    if (!idCardFrontUrl) {
      return NextResponse.json(
        { success: false, error: "请先上传身份证正面照", code: "PP-FACE-004" },
        { status: 400 }
      );
    }

    const result = await kycService.verifyFaceAtUpload(portraitImageUrl, idCardFrontUrl);

    return NextResponse.json({
      success: true,
      data: {
        verifyResult: result.faceResult.verifyResult,
        verifyScore: result.faceResult.verifyScore,
        livenessResult: result.faceResult.livenessResult,
        livenessScore: result.faceResult.livenessScore,
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const code = err instanceof Error ? (err as any).code : undefined;

    console.error("[verify-face] Face verification error:", errMsg, "code:", code);

    if (code === "FACE_MISMATCH") {
      return NextResponse.json(
        { success: false, error: errMsg, code: "PP-FACE-001" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "人脸核验失败：" + errMsg, code: code ?? "PP-FACE-002" },
      { status: 500 }
    );
  }
}
