/**
 * POST /api/v1/authorizations/enterprise/apply
 * 发起企业授权申请
 *
 * GET /api/v1/authorizations/enterprise/apply
 * 获取企业的授权申请列表
 */
import { NextRequest, NextResponse } from "next/server";
import { createEnterpriseAuthApplication, listEnterpriseApplications } from "@/lib/enterprise/authService";
import { getEnterpriseProfile } from "@/lib/enterprise/service";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      portraitId, purpose, usageScope, exclusivity, territorialScope,
      usageDuration, proposedFee, currency,
    } = body;

    if (!portraitId || !purpose || !usageScope?.length || !usageDuration || proposedFee === undefined) {
      return NextResponse.json({ success: false, error: "缺少必填字段" }, { status: 400 });
    }

    const enterprise = await getEnterpriseProfile(session.userId);
    if (!enterprise) throw new Error("请先完成企业认证");
    if (enterprise.status !== "APPROVED") throw new Error("企业认证尚未通过");

    const application = await createEnterpriseAuthApplication(session.userId, {
      enterpriseId: enterprise.id,
      portraitId,
      purpose,
      usageScope,
      exclusivity,
      territorialScope,
      usageDuration: parseInt(usageDuration),
      proposedFee: parseFloat(proposedFee),
      currency,
    });

    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    const message = err instanceof Error ? err.message : "申请失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const enterprise = await getEnterpriseProfile(session.userId);
    if (!enterprise) throw new Error("请先完成企业认证");

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;

    const applications = await listEnterpriseApplications(enterprise.id, status);
    return NextResponse.json({ success: true, data: applications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取列表失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
