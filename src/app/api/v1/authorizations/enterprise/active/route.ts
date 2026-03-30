/**
 * GET /api/v1/authorizations/enterprise/active
 * 获取企业活跃授权列表
 */
import { NextRequest, NextResponse } from "next/server";
import { listActiveAuthorizations } from "@/lib/enterprise/authService";
import { getEnterpriseProfile } from "@/lib/enterprise/service";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const enterprise = await getEnterpriseProfile(session.userId);
    if (!enterprise) throw new Error("请先完成企业认证");

    const active = await listActiveAuthorizations(enterprise.id);
    return NextResponse.json({ success: true, data: active });
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
