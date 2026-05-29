/**
 * GET /api/consent-passport/[token] — Public view (no auth)
 * PATCH /api/consent-passport/[token] — Update by owner (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
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
        email: true,
        allowedUses: true,
        prohibitedUses: true,
        contactInfo: true,
        additionalTerms: true,
        threeViewFront: true,
        threeViewSide: true,
        threeViewTop: true,
        createdAt: true,
      },
    });

    if (!passport) {
      return NextResponse.json({ success: false, error: "Consent Passport not found" }, { status: 404 });
    }

    // Check if the passport owner has completed KYC identity verification
    let kycStatus: string | null = null;
    let kycVerifiedAt: string | null = null;
    const user = await prisma.user.findUnique({
      where: { email: passport.email },
      select: { kycStatus: true, kycVerifiedAt: true },
    });
    if (user) {
      kycStatus = user.kycStatus;
      kycVerifiedAt = user.kycVerifiedAt?.toISOString() ?? null;
    }

    return NextResponse.json({
      success: true,
      data: { ...passport, kycStatus, kycVerifiedAt },
    });
  } catch (error) {
    console.error("[GET /api/consent-passport/[token]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  allowedUses: z.array(z.string()).optional(),
  prohibitedUses: z.array(z.string()).optional(),
  contactInfo: z.string().optional(),
  additionalTerms: z.string().optional(),
  threeViewFront: z.string().nullable().optional(),
  threeViewSide: z.string().nullable().optional(),
  threeViewTop: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
    }

    const passport = await prisma.consentPassport.findUnique({ where: { shareToken: token } });
    if (!passport) {
      return NextResponse.json({ success: false, error: "Consent Passport not found" }, { status: 404 });
    }

    if (passport.email !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.consentPassport.update({
      where: { id: passport.id },
      data: {
        ...(parsed.data.fullName !== undefined && { fullName: parsed.data.fullName }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email }),
        ...(parsed.data.allowedUses !== undefined && { allowedUses: parsed.data.allowedUses }),
        ...(parsed.data.prohibitedUses !== undefined && { prohibitedUses: parsed.data.prohibitedUses }),
        ...(parsed.data.contactInfo !== undefined && { contactInfo: parsed.data.contactInfo ?? null }),
        ...(parsed.data.additionalTerms !== undefined && { additionalTerms: parsed.data.additionalTerms ?? null }),
        ...(parsed.data.threeViewFront !== undefined && { threeViewFront: parsed.data.threeViewFront }),
        ...(parsed.data.threeViewSide !== undefined && { threeViewSide: parsed.data.threeViewSide }),
        ...(parsed.data.threeViewTop !== undefined && { threeViewTop: parsed.data.threeViewTop }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/consent-passport/[token]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
