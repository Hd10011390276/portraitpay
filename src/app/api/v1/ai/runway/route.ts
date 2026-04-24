/**
 * Runway AI Generation API
 *
 * POST /api/v1/ai/runway
 * Body: { portraitId, prompt, style?, duration? }
 *
 * Flow:
 * 1. Verify portrait license
 * 2. Calculate royalty (15% platform, 85% creator)
 * 3. Create license record
 * 4. Route to Runway API
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

const RUNWAY_API_URL = process.env.RUNWAY_API_URL || "https://api.runwayml.com/v1";
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || "";

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
    const { portraitId, prompt, style, duration = 10 } = body;

    if (!portraitId || !prompt) {
      return NextResponse.json(
        { error: "portraitId and prompt are required" },
        { status: 400 }
      );
    }

    // Check if portrait is licensed for AI generation
    const licensed = await isPortraitLicensed(portraitId, "runway");
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
      "AI_VIDEO_GENERATION"
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
        platform: "runway",
        prompt,
        style,
        duration,
      },
      licenseResult.licenseId!,
      royalty
    );

    // If RUNWAY_API_KEY is not configured, return mock response for development
    if (!RUNWAY_API_KEY) {
      return NextResponse.json({
        success: true,
        jobId: `mock_runway_${Date.now()}`,
        status: "pending",
        message: "Development mode: Runway API not configured. License created on-chain.",
        mock: true,
        licenseId: licenseResult.licenseId,
        royalty: {
          total: `${royalty.totalAmount / 100} USD`,
          platformFee: `${royalty.platformFee / 100} USD`,
          creatorShare: `${royalty.creatorShare / 100} USD`,
        },
      });
    }

    // Route to Runway API
    const runwayResponse = await fetch(`${RUNWAY_API_URL}/inference`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        prompt: `[Portrait License] ${prompt}`,
        duration,
        style: style || "realistic",
        // Additional params for portrait-specific generation
        aspect_ratio: "16:9",
        seed: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!runwayResponse.ok) {
      const error = await runwayResponse.text();
      console.error("[Runway API] Error:", error);
      return NextResponse.json(
        { error: "Runway API request failed", details: error },
        { status: 502 }
      );
    }

    const runwayData = await runwayResponse.json();

    return NextResponse.json({
      success: true,
      jobId: runwayData.id || runwayData.jobId,
      status: runwayData.status || "processing",
      outputUrl: runwayData.output,
      licenseId: licenseResult.licenseId,
      royalty: {
        total: `${royalty.totalAmount / 100} USD`,
        platformFee: `${royalty.platformFee / 100} USD`,
        creatorShare: `${royalty.creatorShare / 100} USD`,
      },
    });
  } catch (error) {
    console.error("[Runway API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/ai/runway?jobId=xxx
 * Check status of a Runway generation job
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // Mock response for development
    if (!RUNWAY_API_KEY || jobId.startsWith("mock_runway_")) {
      return NextResponse.json({
        jobId,
        status: "completed",
        output: `https://example.com/runway-output/${jobId}.mp4`,
        mock: true,
      });
    }

    const response = await fetch(`${RUNWAY_API_URL}/inference/${jobId}`, {
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
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
      outputUrl: data.output,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
    });
  } catch (error) {
    console.error("[Runway API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
