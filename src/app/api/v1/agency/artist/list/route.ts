/**
 * GET /api/v1/agency/artist/list
 * 获取经纪公司代理的艺人列表
 */
import { NextRequest, NextResponse } from "next/server";
import { listAgencyArtists } from "@/lib/enterprise/agencyService";
import { getEnterpriseProfile } from "@/lib/enterprise/service";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const enterprise = await getEnterpriseProfile(session.userId);
    if (!enterprise?.isAgency) throw new Error("您不是经纪公司");

    const artists = await listAgencyArtists(enterprise.id);
    return NextResponse.json({ success: true, data: artists });
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
