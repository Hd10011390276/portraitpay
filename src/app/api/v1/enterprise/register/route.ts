/**
 * POST /api/v1/enterprise/register
 * 企业认证注册
 */
import { NextRequest, NextResponse } from "next/server";
import { registerEnterprise } from "@/lib/enterprise/service";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      companyName, unifiedCreditCode, legalPersonName, legalPersonIdCard,
      registeredCapital, establishedDate, businessTerm, businessScope,
      licenseImageUrl, legalPersonIdCardFrontUrl, legalPersonIdCardBackUrl,
      contactName, contactPhone, contactEmail, isAgency, agencyLicenseUrl,
    } = body;

    if (!companyName || !unifiedCreditCode || !legalPersonName || !legalPersonIdCard || !licenseImageUrl || !contactName || !contactPhone || !contactEmail) {
      return NextResponse.json({ success: false, error: "缺少必填字段" }, { status: 400 });
    }

    const enterprise = await registerEnterprise(session.userId, {
      companyName, unifiedCreditCode, legalPersonName, legalPersonIdCard,
      registeredCapital, establishedDate, businessTerm, businessScope,
      licenseImageUrl, legalPersonIdCardFrontUrl, legalPersonIdCardBackUrl,
      contactName, contactPhone, contactEmail, isAgency, agencyLicenseUrl,
    });

    return NextResponse.json({ success: true, data: enterprise });
  } catch (err) {
    const message = err instanceof Error ? err.message : "注册失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
