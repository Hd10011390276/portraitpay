
/**
 * /api/v1/license-portrait - License a Portrait for AI/Commercial Use
 *
 * AI/LLM can call this endpoint with an API key to:
 * - Request a portrait license
 * - Process payment via Stripe
 * - Generate a license record
 *
 * This creates an Authorization and initiates payment flow.
 * The license is only valid after payment succeeds.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey, checkRateLimit, isValidApiKeyFormat } from "@/lib/api-keys";
import { createPaymentIntent } from "@/lib/payments/stripe";
import { PLATFORM_FEE_RATE } from "@/lib/revenue/types";
export const dynamic = "force-dynamic";


export const runtime = "nodejs";

// Valid usage scopes
const VALID_SCOPES = [
  "FILM",
  "ANIMATION",
  "ADVERTISING",
  "GAMING",
  "PRINT",
  "MERCHANDISE",
  "SOCIAL_MEDIA",
  "EDUCATION",
  "NEWS",
];

// Valid territorial scopes
const VALID_TERRITORIAL_SCOPES = [
  "global",
  "china",
  "asia",
  "europe",
  "americas",
];

// POST /api/v1/license-portrait - Initiate license request and payment
export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key. Provide X-API-Key header." },
        { status: 401 }
      );
    }

    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid API key format" },
        { status: 401 }
      );
    }

    // Verify API key
    const verification = await verifyApiKey(apiKey);
    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired API key" },
        { status: 401 }
      );
    }

    const { apiKeyRecord, user } = verification;

    // Check rate limit
    const withinLimit = await checkRateLimit(apiKeyRecord.id, apiKeyRecord.rateLimitPerMinute);
    if (!withinLimit) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // Check scope
    if (!apiKeyRecord.scopes.includes("license_portrait")) {
      return NextResponse.json(
        { success: false, error: "API key does not have license_portrait scope" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      portraitId,
      usageScope = ["FILM"],
      exclusivity = false,
      territorialScope = "global",
      durationDays = 365,
      currency = "CNY",
    } = body as {
      portraitId?: string;
      usageScope?: string[];
      exclusivity?: boolean;
      territorialScope?: string;
      durationDays?: number;
      currency?: string;
    };

    if (!portraitId) {
      return NextResponse.json(
        { success: false, error: "portraitId is required" },
        { status: 400 }
      );
    }

    // Validate usage scopes
    const invalidScopes = usageScope.filter((s) => !VALID_SCOPES.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid usage scopes: ${invalidScopes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate territorial scope
    if (!VALID_TERRITORIAL_SCOPES.includes(territorialScope)) {
      return NextResponse.json(
        { success: false, error: `Invalid territorialScope. Valid: ${VALID_TERRITORIAL_SCOPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate duration
    if (durationDays < 1 || durationDays > 3650) {
      return NextResponse.json(
        { success: false, error: "durationDays must be between 1 and 3650" },
        { status: 400 }
      );
    }

    // Get portrait
    const portrait = await prisma.portrait.findUnique({
      where: { id: portraitId },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!portrait || portrait.deletedAt) {
      return NextResponse.json(
        { success: false, error: "Portrait not found or deleted" },
        { status: 404 }
      );
    }

    if (portrait.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: `Portrait is not active (status: ${portrait.status})` },
        { status: 400 }
      );
    }

    // Check if licensing is allowed (default to true if no settings)
    // Note: portraitSettings field removed from Portrait model — licensing always allowed
    // Cannot license your own portrait
    if (portrait.ownerId === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot license your own portrait" },
        { status: 400 }
      );
    }

    // Calculate license fee (default 100 if no custom fee set)
    const baseFee = 100; // Default 100 CNY/USD
    const scopeMultiplier = usageScope.length * 0.3 + 1; // 30% extra per scope
    const exclusivityMultiplier = exclusivity ? 2.0 : 1.0;
    const durationMultiplier = durationDays / 365;

    const totalFee = Math.round(baseFee * scopeMultiplier * exclusivityMultiplier * durationMultiplier * 100) / 100;

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Create authorization record (PENDING until payment succeeds)
    const platformFee = Math.round(totalFee * PLATFORM_FEE_RATE * 100) / 100;
    const ownerRevenue = Math.round((totalFee - platformFee) * 100) / 100;

    const authorization = await prisma.authorization.create({
      data: {
        portraitId: portrait.id,
        granterId: portrait.ownerId,
        granteeId: user.id,
        licenseType: exclusivity ? "EXCLUSIVE" : "NON_EXCLUSIVE",
        usageScope,
        exclusivity,
        territorialScope,
        startDate,
        endDate,
        licenseFee: totalFee,
        currency: currency.toUpperCase(),
        platformFee,
        actorPayment: ownerRevenue,
        terms: JSON.stringify({
          usageScope,
          exclusivity,
          territorialScope,
          durationDays,
          totalFee,
        }),
        status: "PENDING",
      },
    });

    // Create payment intent
    const amountInCents = Math.round(totalFee * 100);
    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      ownerId: portrait.ownerId,
      granteeId: user.id,
      authorizationId: authorization.id,
      description: `PortraitPay AI - License for portrait "${portrait.title}"`,
      metadata: {
        portraitId: portrait.id,
        usageScope: usageScope.join(","),
        exclusivity: String(exclusivity),
        territorialScope,
        durationDays: String(durationDays),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        authorizationId: authorization.id,
        portraitId: portrait.id,
        portraitTitle: portrait.title,
        ownerId: portrait.ownerId,
        ownerName: portrait.owner.displayName,
        usageScope,
        exclusivity,
        territorialScope,
        startDate,
        endDate,
        licenseFee: totalFee,
        currency: currency.toUpperCase(),
        platformFee,
        ownerRevenue,
        payment: {
          clientSecret,
          paymentIntentId,
          amount: amountInCents,
          currency: currency.toUpperCase(),
        },
        status: "PENDING_PAYMENT",
        message: "Payment initiated. Complete payment to activate license.",
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/license-portrait]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/v1/license-portrait - Get license status
export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key. Provide X-API-Key header." },
        { status: 401 }
      );
    }

    if (!isValidApiKeyFormat(apiKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid API key format" },
        { status: 401 }
      );
    }

    const verification = await verifyApiKey(apiKey);
    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired API key" },
        { status: 401 }
      );
    }

    const { user } = verification;

    const { searchParams } = new URL(request.url);
    const authorizationId = searchParams.get("authorizationId");

    if (authorizationId) {
      // Get specific license/authorization
      const auth = await prisma.authorization.findUnique({
        where: { id: authorizationId },
        include: {
          portrait: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
            },
          },
          licenses: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });

      if (!auth) {
        return NextResponse.json(
          { success: false, error: "Authorization not found" },
          { status: 404 }
        );
      }

      // Check if user is involved in this authorization
      if (auth.granterId !== user.id && auth.granteeId !== user.id) {
        return NextResponse.json(
          { success: false, error: "Not authorized to view this authorization" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          authorizationId: auth.id,
          portrait: auth.portrait,
          status: auth.status,
          licenseType: auth.licenseType,
          usageScope: auth.usageScope,
          exclusivity: auth.exclusivity,
          territorialScope: auth.territorialScope,
          startDate: auth.startDate,
          endDate: auth.endDate,
          licenseFee: auth.licenseFee.toNumber(),
          currency: auth.currency,
          platformFee: auth.platformFee?.toNumber() ?? null,
          actorPayment: auth.actorPayment?.toNumber() ?? null,
          license: auth.licenses[0] ?? null,
          createdAt: auth.createdAt,
        },
      });
    }

    // List all authorizations for this user (as licensee)
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { granteeId: user.id };
    if (status) where.status = status;

    const [authorizations, total] = await Promise.all([
      prisma.authorization.findMany({
        where,
        include: {
          portrait: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
            },
          },
          licenses: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.authorization.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: authorizations.map((auth) => ({
        authorizationId: auth.id,
        portrait: auth.portrait,
        status: auth.status,
        licenseType: auth.licenseType,
        usageScope: auth.usageScope,
        exclusivity: auth.exclusivity,
        territorialScope: auth.territorialScope,
        startDate: auth.startDate,
        endDate: auth.endDate,
        licenseFee: auth.licenseFee.toNumber(),
        currency: auth.currency,
        platformFee: auth.platformFee?.toNumber() ?? null,
        actorPayment: auth.actorPayment?.toNumber() ?? null,
        license: auth.licenses[0] ?? null,
        createdAt: auth.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/license-portrait]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
