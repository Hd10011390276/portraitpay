/**
 * GET /api/v1/kyc/status
 * 查询当前用户 KYC 状态
 */
import { NextResponse } from "next/server";
import { kycService } from "@/lib/kyc/service";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const status = await kycService.getStatus(session.userId);

    return NextResponse.json({ success: true, data: status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get KYC status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
