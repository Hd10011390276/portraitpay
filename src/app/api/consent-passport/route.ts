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
  threeViewFront: z.string().optional(),
  threeViewSide: z.string().optional(),
  threeViewTop: z.string().optional(),
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
        threeViewFront: parsed.data.threeViewFront ?? null,
        threeViewSide: parsed.data.threeViewSide ?? null,
        threeViewTop: parsed.data.threeViewTop ?? null,
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token, ...updates } = body as { token: string } & z.infer<typeof UpdateSchema>;
    if (!token) {
      return NextResponse.json({ success: false, error: "token is required" }, { status: 400 });
    }

    const passport = await prisma.consentPassport.findUnique({ where: { shareToken: token } });
    if (!passport) {
      return NextResponse.json({ success: false, error: "Consent Passport not found" }, { status: 404 });
    }

    // Only owner can update
    if (passport.email !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const parsed = UpdateSchema.safeParse(updates);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
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
    console.error("[PATCH /api/consent-passport]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
