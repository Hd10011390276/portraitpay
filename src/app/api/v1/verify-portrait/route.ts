
/**
 * /api/v1/verify-portrait - Verify Portrait Usage Rights
 *
 * AI/LLM can call this endpoint with an API key to check:
 * - If a portrait exists and get usage rights
 * - Whether usage is allowed and the price
 *
 * Rate limited based on API key configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey, checkRateLimit, isValidApiKeyFormat } from "@/lib/api-keys";
export const dynamic = "force-dynamic";


export const runtime = "nodejs";

// GET /api/v1/verify-portrait - Check portrait usage rights
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

    // Validate API key format first (quick check before DB lookup)
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

    const { apiKeyRecord } = verification;

    // Check rate limit
    const withinLimit = await checkRateLimit(apiKeyRecord.id, apiKeyRecord.rateLimitPerMinute);
    if (!withinLimit) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // Check scope
    if (!apiKeyRecord.scopes.includes("verify_portrait") && !apiKeyRecord.scopes.includes("read_portraits")) {
      return NextResponse.json(
        { success: false, error: "API key does not have verify_portrait scope" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const portraitId = searchParams.get("portraitId");
    const faceId = searchParams.get("faceId");

    if (!portraitId && !faceId) {
      return NextResponse.json(
        { success: false, error: "Either portraitId or faceId is required" },
        { status: 400 }
      );
    }

    let portrait;
    if (portraitId) {
      portrait = await prisma.portrait.findUnique({
        where: { id: portraitId },
        include: {
          owner: {
            select: {
              id: true,
              displayName: true,
              role: true,
            },
          },
        },
      });
    } else if (faceId) {
      // Search by face ID
      portrait = await prisma.portrait.findFirst({
        where: {
          id: faceId,
          status: "ACTIVE",
          deletedAt: null,
        },
        include: {
          owner: {
            select: {
              id: true,
              displayName: true,
              role: true,
            },
          },
        },
      });
    }

    if (!portrait || portrait.deletedAt) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          usageAllowed: false,
          reason: "Portrait not found or deleted",
        },
      });
    }

    if (portrait.status !== "ACTIVE") {
      return NextResponse.json({
        success: true,
        data: {
          exists: true,
          portraitId: portrait.id,
          status: portrait.status,
          usageAllowed: false,
          reason: `Portrait is not active (status: ${portrait.status})`,
        },
      });
    }

    // Portrait settings no longer exist — licensing always allowed by default
    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        portraitId: portrait.id,
        title: portrait.title,
        description: portrait.description,
        ownerId: portrait.ownerId,
        ownerName: portrait.owner.displayName,
        ownerRole: portrait.owner.role,
        status: portrait.status,
        usageAllowed: true,
        licenseFee: 0,
        currency: "USD",
        allowedScopes: ["FILM", "ANIMATION", "ADVERTISING", "GAMING", "PRINT", "MERCHANDISE", "SOCIAL_MEDIA", "EDUCATION", "NEWS"],
        prohibitedContent: [],
        territorialScope: "global",
        blockchainTxHash: portrait.blockchainTxHash,
        certifiedAt: portrait.certifiedAt,
        message: "Portrait is available for licensing",
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/verify-portrait]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/v1/verify-portrait - Verify portrait with face embedding
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

    // Validate API key format first
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

    const { apiKeyRecord } = verification;

    // Check rate limit
    const withinLimit = await checkRateLimit(apiKeyRecord.id, apiKeyRecord.rateLimitPerMinute);
    if (!withinLimit) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // Check scope
    if (!apiKeyRecord.scopes.includes("verify_portrait") && !apiKeyRecord.scopes.includes("read_portraits")) {
      return NextResponse.json(
        { success: false, error: "API key does not have verify_portrait scope" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { descriptor, minScore = 0.5, topK = 5 } = body as {
      descriptor?: number[];
      minScore?: number;
      topK?: number;
    };

    if (!descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json(
        { success: false, error: "Face descriptor (number array) is required" },
        { status: 400 }
      );
    }

    // STUB: In production, this would:
    // 1. Query all stored face embeddings from database
    // 2. Compute cosine similarity between query embedding and stored embeddings
    // 3. Filter by minScore threshold
    // 4. Sort by similarity score descending
    // 5. Return topK matches with usage rights

    // For now, return stub response indicating face search capability
    return NextResponse.json({
      success: true,
      data: {
        provider: "stub",
        message: "Face embedding search is not yet implemented",
        suggestion: "Use portraitId parameter with GET /api/v1/verify-portrait for now",
        queryDescriptorLength: descriptor.length,
        minScore,
        topK,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/verify-portrait]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
