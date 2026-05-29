/**
 * GET /api/v1/agency/contracts
 * 获取当前经纪公司的所有艺人合同 (AgencyArtistContract)
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

    const contracts = await prisma.agencyArtistContract.findMany({
      where: { agencyId: agency.id },
      include: {
        artistUser: {
          select: { id: true, displayName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, contracts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch contracts";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}