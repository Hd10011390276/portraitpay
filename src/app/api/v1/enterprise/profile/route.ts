/**
 * GET /api/v1/enterprise/profile - 获取企业认证信息
 * PATCH /api/v1/enterprise/profile - 更新企业信息
 */
import { NextRequest, NextResponse } from "next/server";
import { getEnterpriseProfile, updateEnterprise } from "@/lib/enterprise/service";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const enterprise = await getEnterpriseProfile(session.userId);
    if (!enterprise) {
      return NextResponse.json({ success: false, error: "企业认证记录不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: enterprise });
  } catch (err) {
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await updateEnterprise(session.userId, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
