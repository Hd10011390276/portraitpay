/**
 * GET /api/v1/agency/assets
 * 获取当前机构的数字资产（AI 内容 + IP 注册）
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agency = await prisma.agencyAccount.findUnique({
      where: { userId: session.userId },
    });

    if (!agency) {
      return NextResponse.json({ success: false, error: "Agency not found" }, { status: 404 });
    }

    // Get assets owned by the agency itself
    const [aiContents, ipRegistrations] = await Promise.all([
      prisma.aIContent.findMany({
        where: { ownerId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.iPRegistration.findMany({
        where: { ownerId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const assets = [
      ...aiContents.map(c => ({ ...c, assetType: "AI_CONTENT" })),
      ...ipRegistrations.map(r => ({ ...r, assetType: "IP_REGISTRATION" })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, assets });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch assets";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}