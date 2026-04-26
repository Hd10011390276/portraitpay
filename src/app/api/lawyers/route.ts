/**
 * GET /api/lawyers — List approved lawyers for user dashboard display
 * Public endpoint (no auth required)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country"); // optional filter

    const where: Record<string, unknown> = {
      status: "APPROVED",
    };

    if (country) {
      where.region = country;
    }

    const lawyers = await prisma.lawyerRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        lawyerType: true,
        region: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        createdAt: true,
      },
    });

    // Map region -> country for frontend compatibility
    const mapped = lawyers.map((l) => ({
      ...l,
      country: l.region,
    }));

    return NextResponse.json({ success: true, data: mapped });

    return NextResponse.json({ success: true, data: lawyers });
  } catch (err) {
    console.error("[GET /api/lawyers]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch lawyers" }, { status: 500 });
  }
}
