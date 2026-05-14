/**
 * POST /api/consent-passport — Create a new Consent Passport
 * GET /api/consent-passport — List current user's Consent Passports (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  allowedUses: z.array(z.string()).default([]),
  prohibitedUses: z.array(z.string()).default([]),
  contactInfo: z.string().optional(),
  additionalTerms: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const passport = await prisma.consentPassport.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        allowedUses: parsed.data.allowedUses,
        prohibitedUses: parsed.data.prohibitedUses,
        contactInfo: parsed.data.contactInfo ?? null,
        additionalTerms: parsed.data.additionalTerms ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: passport.id,
        shareToken: passport.shareToken,
        shareUrl: `/consent-passport/${passport.shareToken}`,
      },
    });
  } catch (error) {
    console.error("[POST /api/consent-passport]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const passports = await prisma.consentPassport.findMany({
      where: { email: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: passports });
  } catch (error) {
    console.error("[GET /api/consent-passport]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
