
/**
 * POST /api/v1/kyc/submit
 *
 * 本地 KYC 流程（无云端调用）：
 * - 前端：face-api.js 做身份证 vs 肖像人脸比对
 * - 后端：接收比对结果 + 身份证号 hash，直接 APPROVE
 *
 * Body: {
 *   level: number,
 *   idCardNumberHash: string,     // 身份证号的 SHA-256（不传真实号码）
 *   faceMatchScore: number,     // face-api.js 比对分数 0-100
 *   portraitHash: string,        // 肖像照片的 SHA-256
 *   name?: string,               // 脱敏姓名（可选）
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { verifyToken } from "@/lib/auth/jwt";
import type { Prisma } from "@prisma/client";
export const dynamic = "force-dynamic";

const MIN_FACE_SCORE = 60; // face-api.js cosine similarity 阈值

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { level, idCardNumberHash, faceMatchScore, portraitHash, name } = body;

    console.log("[KYC SUBMIT (LOCAL)] userId:", session.userId, {
      level, idCardNumberHash: idCardNumberHash?.slice(0, 8) + "...?",
      faceMatchScore, portraitHash: portraitHash?.slice(0, 8) + "...?",
    });

    // ── Validation ────────────────────────────────────────────────
    if (!idCardNumberHash || !portraitHash) {
      return NextResponse.json(
        { success: false, error: "idCardNumberHash and portraitHash are required" },
        { status: 400 }
      );
    }

    if (typeof faceMatchScore !== "number" || faceMatchScore < 0 || faceMatchScore > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid faceMatchScore (must be 0-100)" },
        { status: 400 }
      );
    }

    if (faceMatchScore < MIN_FACE_SCORE) {
      return NextResponse.json(
        {
          success: false,
          error: `人脸比对未通过（分数${faceMatchScore}，需要${MIN_FACE_SCORE}）`,
          data: { faceMatchScore },
        },
        { status: 400 }
      );
    }

    // ── Write KYCLog ───────────────────────────────────────────────
    await prisma.kYCLog.create({
      data: {
        userId: session.userId,
        provider: "local",
        action: "submit_local",
        level: level ?? 2,
        idCardNumber: idCardNumberHash ? idCardNumberHash.slice(0, 8) + "****" : null,
        idCardName: name ? name.slice(0, 2) + "**" : null,
        faceMatchScore,
        ocrRawData: { portraitHash, idCardNumberHash } as Prisma.InputJsonValue,
      },
    });

    // ── APPROVE KYC ───────────────────────────────────────────────
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        kycStatus: "APPROVED",
        kycVerifiedAt: new Date(),
        kycExpiredAt: addMonths(new Date(), 12),
        kycLevel: level ?? 2,
        kycProviderRef: `local_${session.userId}_${Date.now()}`,
      },
    });

    console.log("[KYC SUBMIT (LOCAL)] APPROVED for user:", session.userId);

    return NextResponse.json({
      success: true,
      data: {
        message: "KYC approved",
        kycStatus: "APPROVED",
        kycLevel: level ?? 2,
        expiredAt: addMonths(new Date(), 12).toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "KYC submit failed";
    console.error("[KYC SUBMIT (LOCAL)] error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
