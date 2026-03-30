/**
 * POST /api/v1/authorizations/enterprise/apply/:id/confirm
 * 肖像所有者确认授权
 */
import { NextRequest, NextResponse } from "next/server";
import { confirmByPortraitOwner } from "@/lib/enterprise/authService";
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

    const result = await confirmByPortraitOwner(params.id, session.userId);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "确认失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
