/**
 * POST /api/v1/agency/artist/add
 * 经纪公司添加代理艺人
 */
import { NextRequest, NextResponse } from "next/server";
import { addArtistToAgency } from "@/lib/enterprise/agencyService";
import { getEnterpriseProfile } from "@/lib/enterprise/service";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const enterprise = await getEnterpriseProfile(session.userId);
    if (!enterprise?.isAgency) throw new Error("您不是经纪公司");
    if (enterprise.status !== "APPROVED") throw new Error("经纪公司认证尚未通过");

    const body = await req.json();
    const { artistId, proxyAgreementUrl, proxyStartDate, proxyEndDate } = body;
    if (!artistId) return NextResponse.json({ success: false, error: "artistId 必填" }, { status: 400 });

    const result = await addArtistToAgency({
      agencyId: enterprise.id,
      artistId,
      proxyAgreementUrl,
      proxyStartDate,
      proxyEndDate,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "添加失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
