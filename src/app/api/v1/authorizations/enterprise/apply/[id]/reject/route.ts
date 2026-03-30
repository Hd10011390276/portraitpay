/**
 * POST /api/v1/authorizations/enterprise/apply/:id/reject
 * 拒绝授权申请（肖像所有者 或 平台管理员）
 */
import { NextRequest, NextResponse } from "next/server";
import { rejectByPortraitOwner, rejectByPlatform } from "@/lib/enterprise/authService";
import { getSession } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reason, role } = body; // role: "owner" | "platform"

    if (role === "platform") {
      if (!reason) return NextResponse.json({ success: false, error: "请填写拒绝原因" }, { status: 400 });
      const result = await rejectByPlatform(params.id, session.userId, reason);
      return NextResponse.json({ success: true, data: result });
    }

    const result = await rejectByPortraitOwner(params.id, session.userId, reason);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "拒绝失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
