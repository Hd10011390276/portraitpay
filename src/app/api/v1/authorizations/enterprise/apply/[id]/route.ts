/**
 * GET /api/v1/authorizations/enterprise/apply/:id
 * 获取授权申请详情
 */
import { NextRequest, NextResponse } from "next/server";
import { getApplicationDetail } from "@/lib/enterprise/authService";
import { getSession } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const application = await getApplicationDetail(params.id);
    if (!application) {
      return NextResponse.json({ success: false, error: "申请不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
