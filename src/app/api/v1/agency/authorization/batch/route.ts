/**
 * POST /api/v1/agency/authorization/batch
 * 经纪公司批量发起授权申请
 */
import { NextRequest, NextResponse } from "next/server";
import { batchCreateAuthorization } from "@/lib/enterprise/agencyService";
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

    const body = await req.json();
    const {
      portraitIds, enterpriseId, purpose, usageScope,
      exclusivity, territorialScope, usageDuration, proposedFee, currency,
    } = body;

    if (!portraitIds?.length || !enterpriseId || !purpose || !usageScope?.length || !usageDuration) {
      return NextResponse.json({ success: false, error: "缺少必填字段" }, { status: 400 });
    }

    if (portraitIds.length > 1000) {
      return NextResponse.json({ success: false, error: "单次批量最多 1000 个肖像" }, { status: 400 });
    }

    const results = await batchCreateAuthorization({
      agencyId: enterprise.id,
      portraitIds,
      enterpriseId,
      purpose,
      usageScope,
      exclusivity,
      territorialScope,
      usageDuration: parseInt(usageDuration),
      proposedFee: parseFloat(proposedFee),
      currency,
    });

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "批量申请失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
