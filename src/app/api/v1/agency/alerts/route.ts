/**
 * GET /api/v1/agency/alerts
 * 获取当前机构的侵权警报列表
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

    // Get portraits owned by artists represented by this agency via active contracts
    const artistContracts = await prisma.agencyArtistContract.findMany({
      where: { agencyId: agency.id, status: "ACTIVE" },
      select: { artistUserId: true },
    });
    const artistIds = artistContracts.map(a => a.artistUserId);

    const portraits = await prisma.portrait.findMany({
      where: { ownerId: { in: artistIds } },
      select: { id: true },
    });
    const portraitIds = portraits.map(p => p.id);

    // Get alerts for those portraits
    const alerts = await prisma.infringementAlert.findMany({
      where: { portraitId: { in: portraitIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, alerts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch alerts";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}