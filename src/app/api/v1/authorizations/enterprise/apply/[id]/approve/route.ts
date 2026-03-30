/**
 * POST /api/v1/authorizations/enterprise/apply/:id/approve
 * 平台管理员批准授权申请
 */
import { NextRequest, NextResponse } from "next/server";
import { approveByPlatform } from "@/lib/enterprise/authService";
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
    // TODO: verify session.user.role === ADMIN || VERIFIER

    const body = await req.json();
    const { actualFee } = body;
    if (actualFee === undefined) {
      return NextResponse.json({ success: false, error: "actualFee 为必填" }, { status: 400 });
    }

    const result = await approveByPlatform(params.id, session.userId, parseFloat(actualFee));
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "审核失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
