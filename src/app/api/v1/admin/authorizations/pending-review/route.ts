/**
 * GET /api/v1/admin/authorizations/pending-review
 * 获取待平台审核的授权申请列表（管理员）
 */
import { NextRequest, NextResponse } from "next/server";
import { listPendingPlatformReview } from "@/lib/enterprise/authService";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const result = await listPendingPlatformReview(page, limit);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}
