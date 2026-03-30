/**
 * GET /api/v1/authorizations/owner/pending
 * 获取肖像所有者收到的待确认授权申请
 */
import { NextRequest, NextResponse } from "next/server";
import { listOwnerApplications } from "@/lib/enterprise/authService";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;

    const applications = await listOwnerApplications(session.userId, status);

    // 附加企业信息
    const enterpriseIds = Array.from(new Set(applications.map(a => a.enterpriseId)));
    const enterprises = await prisma_enterprise_findMany({ where: { id: { in: enterpriseIds } } });
    const entMap = Object.fromEntries(enterprises.map(e => [e.id, e]));

    const enriched = applications.map(app => ({
      ...app,
      enterprise: entMap[app.enterpriseId] ?? null,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// Helper inline to avoid circular import issue
async function prisma_enterprise_findMany(opts: any) {
  const { prisma } = await import("@/lib/prisma");
  return prisma.enterprise.findMany(opts);
}
