/**
 * POST /api/v1/kyc/init
 * 初始化 KYC 认证会话
 */
import { NextRequest, NextResponse } from "next/server";
import { kycService } from "@/lib/kyc/service";
import type { KYCLevel } from "@/lib/kyc/types";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const level = (body.level ?? 2) as KYCLevel;

    if (![1, 2, 3].includes(level)) {
      return NextResponse.json(
        { success: false, error: "Invalid KYC level. Must be 1, 2, or 3." },
        { status: 400 }
      );
    }

    const result = await kycService.init(session.userId, level);

    return NextResponse.json({
      success: true,
      data: {
        sessionToken: result.sessionToken,
        redirectUrl: result.redirectUrl,
        expireAt: result.expireAt,
        provider: process.env.KYC_PROVIDER ?? "aliyun",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "KYC init failed";
    const status = message.includes("already approved") ? 409 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
