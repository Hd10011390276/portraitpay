/**
 * GET /api/consent-passport/[token] — Public view of a Consent Passport (no auth)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const passport = await prisma.consentPassport.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        fullName: true,
        allowedUses: true,
        prohibitedUses: true,
        contactInfo: true,
        additionalTerms: true,
        createdAt: true,
      },
    });

    if (!passport) {
      return NextResponse.json({ success: false, error: "Consent Passport not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: passport });
  } catch (error) {
    console.error("[GET /api/consent-passport/[token]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
