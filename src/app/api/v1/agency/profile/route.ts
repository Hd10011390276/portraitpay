/**
 * GET /api/v1/agency/profile
 * 获取当前登录用户的 AgencyAccount 信息
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
      include: {
        parentAgency: { select: { agencyName: true, agencyType: true } },
        escrow: true,
        _count: {
          select: {
            artistContracts: true,
            childAgencies: true,
          },
        },
      },
    });

    if (!agency) {
      return NextResponse.json({ success: false, error: "Agency not found" }, { status: 404 });
    }

    // Count active contracts
    const activeContracts = await prisma.agencyArtistContract.count({
      where: { agencyId: agency.id, status: "ACTIVE" },
    });

    return NextResponse.json({
      success: true,
      agency,
      stats: {
        totalArtists: agency._count.artistContracts,
        totalContracts: agency._count.artistContracts,
        activeContracts,
        childAgencies: agency._count.childAgencies,
        escrowAvailable: agency.escrow?.availableAmount ?? "0",
        escrowTotal: agency.escrow?.totalAmount ?? "0",
        escrowCurrency: agency.escrow?.currency ?? "USD",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch agency profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}