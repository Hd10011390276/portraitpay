/**
 * Midjourney AI Generation API
 *
 * POST /api/v1/ai/midjourney
 * Body: { portraitId, prompt, style?, aspectRatio? }
 *
 * Flow:
 * 1. Verify portrait license
 * 2. Calculate royalty (15% platform, 85% creator)
 * 3. Create license record
 * 4. Route to Midjourney API (via Discord webhook or official API)
 * 5. Return job ID for status tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-keys";
import {
  isPortraitLicensed,
  getLicensingFee,
  calculateRoyalty,
  createOnChainLicense,
  createAIGenerationRecord,
  getPortraitLicensing,
} from "@/lib/ai-generation";

const MIDJOURNEY_API_URL = process.env.MIDJOURNEY_API_URL || "https://api.midjourney.com/v1";
const MIDJOURNEY_API_KEY = process.env.MIDJOURNEY_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    // Verify API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const { user: apiKeyUser } = (await verifyApiKey(apiKey)) ?? {};
    if (!apiKeyUser) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await req.json();
    const { portraitId, prompt, style, aspectRatio = "1:1" } = body;

    if (!portraitId || !prompt) {
      return NextResponse.json(
        { error: "portraitId and prompt are required" },
        { status: 400 }
      );
    }

    // Check if portrait is licensed for AI generation
    const licensed = await isPortraitLicensed(portraitId, "midjourney");
    if (!licensed) {
      return NextResponse.json(
        { error: "Portrait not licensed for AI generation" },
        { status: 403 }
      );
    }

    // Get licensing fee
    const feeCents = await getLicensingFee(portraitId);
    if (feeCents === 0) {
      return NextResponse.json(
        { error: "Licensing fee not set. Please set a fee in portrait settings." },
        { status: 400 }
      );
    }

    // Get portrait owner info
    const portrait = await getPortraitLicensing(portraitId);
    if (!portrait.owner.walletAddress) {
      return NextResponse.json(
        { error: "Portrait owner has not set up wallet address" },
        { status: 400 }
      );
    }

    // Calculate royalty
    const royalty = calculateRoyalty(feeCents);
    royalty.creatorAddress = portrait.owner.walletAddress;

    // Create on-chain license
    const licenseResult = await createOnChainLicense(
      portraitId,
      apiKeyUser.id, // licensee
      feeCents,
      "AI_IMAGE_GENERATION"
    );

    if (!licenseResult.success) {
      return NextResponse.json(
        { error: "Failed to create license record", details: licenseResult.error },
        { status: 500 }
      );
    }

    // Create database transaction record
    await createAIGenerationRecord(
      {
        userId: apiKeyUser.id,
        portraitId,
        platform: "midjourney",
        prompt,
        style,
      },
      licenseResult.licenseId!,
      royalty
    );

    // If MIDJOURNEY_API_KEY is not configured, return mock response for development
    if (!MIDJOURNEY_API_KEY) {
      return NextResponse.json({
        success: true,
        jobId: `mock_mj_${Date.now()}`,
        status: "pending",
        message: "Development mode: Midjourney API not configured. License created on the platform.",
        mock: true,
        licenseId: licenseResult.licenseId,
        royalty: {
          total: `${royalty.totalAmount / 100} USD`,
          platformFee: `${royalty.platformFee / 100} USD`,
          creatorShare: `${royalty.creatorShare / 100} USD`,
        },
      });
    }

    // Route to Midjourney API
    const mjResponse = await fetch(`${MIDJOURNEY_API_URL}/imagine`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MIDJOURNEY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `[Portrait License] ${prompt}`,
        aspect_ratio: aspectRatio,
        style: style || "realistic",
        model: "v6",
      }),
    });

    if (!mjResponse.ok) {
      const error = await mjResponse.text();
      console.error("[Midjourney API] Error:", error);
      return NextResponse.json(
        { error: "Midjourney API request failed", details: error },
        { status: 502 }
      );
    }

    const mjData = await mjResponse.json();

    return NextResponse.json({
      success: true,
      jobId: mjData.id || mjData.taskId,
      status: mjData.status || "processing",
      outputUrl: mjData.imageUrl || mjData.output,
      licenseId: licenseResult.licenseId,
      royalty: {
        total: `${royalty.totalAmount / 100} USD`,
        platformFee: `${royalty.platformFee / 100} USD`,
        creatorShare: `${royalty.creatorShare / 100} USD`,
      },
    });
  } catch (error) {
    console.error("[Midjourney API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/ai/midjourney?jobId=xxx
 * Check status of a Midjourney generation job
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // Mock response for development
    if (!MIDJOURNEY_API_KEY || jobId.startsWith("mock_mj_")) {
      return NextResponse.json({
        jobId,
        status: "completed",
        imageUrl: `https://example.com/midjourney-output/${jobId}.png`,
        mock: true,
      });
    }

    const response = await fetch(`${MIDJOURNEY_API_URL}/task/${jobId}`, {
      headers: {
        "Authorization": `Bearer ${MIDJOURNEY_API_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get job status" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      jobId: data.id,
      status: data.status,
      imageUrl: data.imageUrl,
      progress: data.progress,
      createdAt: data.createdAt,
    });
  } catch (error) {
    console.error("[Midjourney API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
