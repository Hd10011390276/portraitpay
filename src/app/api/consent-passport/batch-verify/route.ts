/**
 * GET /api/consent-passport/batch-verify?query=email1,email2,...
 * Search Consent Passports by email addresses (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? "";

    if (!query.trim()) {
      return NextResponse.json({ success: false, error: "query is required" }, { status: 400 });
    }

    const terms = query.split(/[\n,]/).map((t) => t.trim()).filter(Boolean);

    if (terms.length === 0) {
      return NextResponse.json({ success: false, error: "No valid terms provided" }, { status: 400 });
    }

    if (terms.length > 50) {
      return NextResponse.json({ success: false, error: "Maximum 50 queries at a time" }, { status: 400 });
    }

    // Search by email or full name
    const passports = await prisma.consentPassport.findMany({
      where: {
        OR: [
          { email: { in: terms, mode: "insensitive" } },
          { fullName: { in: terms, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Also check portrait owners (by email)
    const portraitOwners = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: terms, mode: "insensitive" } },
          { displayName: { in: terms, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        portraits: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            title: true,
            allowAiLicensing: true,
            aiLicenseScopes: true,
            aiProhibitedScopes: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        passports,
        portraitOwners,
      },
    });
  } catch (error) {
    console.error("[GET /api/consent-passport/batch-verify]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
