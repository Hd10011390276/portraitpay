/**
 * GET /api/debug/db-check — Minimal health check (no DB, no S3)
 * If this times out → Vercel function cold boot or network issue
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasAwsBucket: !!process.env.AWS_S3_BUCKET,
      hasAwsEndpoint: !!process.env.AWS_ENDPOINT,
      kycProvider: process.env.KYC_PROVIDER ?? "aliyun",
      kycAliyunStub: process.env.KYC_ALIYUN_STUB ?? "not-set",
      kycAliyunKeyId: !!process.env.KYC_ALIYUN_ACCESS_KEY_ID,
      kycAliyunKeySecret: !!process.env.KYC_ALIYUN_ACCESS_KEY_SECRET,
      alibabaKeyId: !!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      alibabaKeySecret: !!process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    },
  });
}