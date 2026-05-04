import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { kycService } from "@/lib/kyc/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  
  let userId = request.nextUrl.searchParams.get("userId");
  
  if (!session?.userId && !userId) {
    return NextResponse.json({ 
      success: false, 
      error: "No session and no userId",
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        kycAliyunStub: process.env.KYC_ALIYUN_STUB,
        kycAliyunAccessKeyId: !!process.env.KYC_ALIYUN_ACCESS_KEY_ID,
        kycAliyunAccessKeySecret: !!process.env.KYC_ALIYUN_ACCESS_KEY_SECRET,
        kycProvider: process.env.KYC_PROVIDER,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 401 });
  }

  if (!userId && session?.userId) userId = session.userId;

  // Test face verification with stub URLs
  let faceVerifyResult = null;
  let faceVerifyError = null;
  try {
    const result = await kycService.verifyFaceAtUpload(
      "https://portraitpayai.com/test-portrait.jpg",
      "https://portraitpayai.com/test-idcard.jpg"
    );
    faceVerifyResult = result;
  } catch (err: any) {
    faceVerifyError = { message: err.message, code: err.code };
  }

  try {
    const count = await prisma.portrait.count({ where: { ownerId: userId } });
    
    const testTitle = `DEBUG-${Date.now()}`;
    const testPortrait = await prisma.portrait.create({
      data: {
        title: testTitle,
        category: "general",
        ownerId: userId!,
        status: "DRAFT",
        faceEmbedding: [],
      },
    });
    
    await prisma.portrait.delete({ where: { id: testPortrait.id } });

    return NextResponse.json({
      success: true,
      debug: true,
      session: session ? { userId: session.userId, email: session.email } : null,
      dbConnection: "OK",
      portraitCount: count,
      testCreate: "OK",
      faceVerify: faceVerifyResult ? "OK" : "FAILED",
      faceVerifyResult,
      faceVerifyError,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        kycAliyunStub: process.env.KYC_ALIYUN_STUB,
        kycAliyunAccessKeyId: !!process.env.KYC_ALIYUN_ACCESS_KEY_ID,
        kycAliyunAccessKeySecret: !!process.env.KYC_ALIYUN_ACCESS_KEY_SECRET,
        kycProvider: process.env.KYC_PROVIDER,
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      code: err.code,
      faceVerify: faceVerifyResult ? "OK" : "FAILED",
      faceVerifyError,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        kycAliyunStub: process.env.KYC_ALIYUN_STUB,
        kycAliyunAccessKeyId: !!process.env.KYC_ALIYUN_ACCESS_KEY_ID,
        kycAliyunAccessKeySecret: !!process.env.KYC_ALIYUN_ACCESS_KEY_SECRET,
        kycProvider: process.env.KYC_PROVIDER,
      }
    }, { status: 500 });
  }
}
