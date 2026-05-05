/**
 * POST /api/portraits/[id]/verify-face
 * 上传肖像后立即做人脸比对（不依赖 KYC approval）
 * 直接调用阿里云 CompareFace API 比对肖像照和身份证照片
 * 核验通过/失败时发送邮件通知
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { kycService } from "@/lib/kyc/service";
import { sendKYCFacePassedEmail, sendKYCFaceFailedEmail } from "@/lib/email";

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
      select: {
        ownerId: true,
        title: true,
        originalImageUrl: true,
        idCardFrontUrl: true,
        portraitImageIpfsUrl: true,
        idCardFrontIpfsUrl: true,
        owner: { select: { email: true, name: true } },
      },
    });

    console.log(`[verify-face] Looking up portrait id=${id}`);
    if (!portrait) {
      console.log(`[verify-face] Portrait ${id} not found in database`);
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }
    console.log(`[verify-face] Portrait found: ownerId=${portrait.ownerId}, hasOriginalImage=${!!portrait.originalImageUrl}, hasIdCard=${!!portrait.idCardFrontUrl}, hasIpfsPortrait=${!!portrait.portraitImageIpfsUrl}, hasIpfsIdCard=${!!portrait.idCardFrontIpfsUrl}`);

    if (portrait.ownerId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    console.log(`[verify-face] Request body keys: ${Object.keys(body).join(', ')}`);
    console.log(`[verify-face] portrait.originalImageUrl from DB: ${portrait.originalImageUrl}`);

    // Prefer OSS signed URLs (most reliable for Aliyun) > IPFS URLs > R2 URLs.
    // Aliyun CompareFace API only accepts Shanghai OSS URLs.
    const portraitImageUrl = body.portraitImageOssUrl ?? portrait.portraitImageOssUrl ?? body.portraitImageIpfsUrl ?? portrait.portraitImageIpfsUrl ?? portrait.originalImageUrl;
    const idCardFrontUrl = body.idCardFrontOssUrl ?? portrait.idCardFrontOssUrl ?? body.idCardFrontIpfsUrl ?? portrait.idCardFrontIpfsUrl ?? portrait.idCardFrontUrl;
    console.log(`[verify-face] Final portraitImageUrl: ${portraitImageUrl}, idCardFrontUrl: ${idCardFrontUrl}`);

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

    // Store face verification timestamp on the portrait record
    // This is used at mint time to skip redundant KYC approval check
    await prisma.portrait.update({
      where: { id },
      data: { faceVerifiedAt: new Date() },
    });

    // Send KYC passed email (non-blocking)
    const ownerEmail = portrait.owner?.email;
    const ownerName = portrait.owner?.name ?? ownerEmail?.split("@")[0] ?? "用户";
    const portraitTitle = portrait.title ?? "肖像";

    if (ownerEmail) {
      sendKYCFacePassedEmail({
        name: ownerName,
        email: ownerEmail,
        portraitTitle,
        verifyScore: result.faceResult.verifyScore,
      }).catch((e: unknown) => console.error("[verify-face] Failed to send KYC passed email:", e));
    }

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
      // Send KYC failed email (non-blocking)
      const portrait = await prisma.portrait.findUnique({
        where: { id: (await context.params).id },
        select: {
          owner: { select: { email: true, name: true } },
          title: true,
        },
      }).catch(() => null);

      if (portrait?.owner?.email) {
        sendKYCFaceFailedEmail({
          name: portrait.owner.name ?? portrait.owner.email.split("@")[0],
          email: portrait.owner.email,
          portraitTitle: portrait.title ?? "肖像",
          reason: "人脸与身份证照片不匹配，请确认上传的是同一人清晰的照片。",
        }).catch((e: unknown) => console.error("[verify-face] Failed to send KYC failed email:", e));
      }

      return NextResponse.json(
        { success: false, error: "人脸与身份证照片不匹配，请确认上传的是同一人清晰的照片。", code: "PP-FACE-001" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "人脸核验服务暂时不可用，请稍后重试。", code: code ?? "PP-FACE-002", detail: errMsg },
      { status: 500 }
    );
  }
}
