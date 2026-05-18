/**
 * /api/v1/admin/api-keys - AI Platform API Key Management
 *
 * GET  - List all AI platform API keys (admin only)
 * POST - Create a new AI platform API key (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { createAiPlatformApiKey } from "@/lib/ai-platform-api-keys";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/api-keys - List all AI platform API keys
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (platform) where.platformName = { contains: platform, mode: "insensitive" };

    const [apiKeys, total] = await Promise.all([
      prisma.aiPlatformApiKey.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aiPlatformApiKey.count({ where }),
    ]);

    // Return masked keys (no keyHash exposed)
    return NextResponse.json({
      success: true,
      data: apiKeys.map((key) => ({
        id: key.id,
        platformName: key.platformName,
        keyPrefix: key.keyPrefix,
        status: key.status,
        scopes: key.scopes,
        rateLimitPerMinute: key.rateLimitPerMinute,
        lastUsedAt: key.lastUsedAt,
        requestCount: key.requestCount.toString(),
        expiresAt: key.expiresAt,
        note: key.note,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        // Display preview: "pp_live_...xxxxxx"
        displayKey: `${key.keyPrefix}...${key.keyHash.slice(-6)}`,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/admin/api-keys]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/admin/api-keys - Create a new AI platform API key
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { platformName, scopes = [], note, expiresAt } = body as {
      platformName?: string;
      scopes?: string[];
      note?: string;
      expiresAt?: string;
    };

    if (!platformName || typeof platformName !== "string" || platformName.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Platform name is required" }, { status: 400 });
    }

    if (!Array.isArray(scopes)) {
      return NextResponse.json({ success: false, error: "Scopes must be an array" }, { status: 400 });
    }

    // Validate scopes
    const validScopes = ["portrait:read", "portrait:license", "portrait:verify", "earnings:read"];
    const invalidScopes = scopes.filter((s) => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid scopes: ${invalidScopes.join(", ")}` },
        { status: 400 }
      );
    }

    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;
    if (expiresAtDate && isNaN(expiresAtDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid expiresAt date" }, { status: 400 });
    }

    const { record, rawKey } = await createAiPlatformApiKey(
      session.userId,
      platformName.trim(),
      scopes,
      note,
      expiresAtDate
    );

    if (!record) {
      return NextResponse.json({ success: false, error: "Failed to create API key" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        platformName: record.platformName,
        keyPrefix: record.keyPrefix,
        rawKey, // Only returned once, never stored
        status: record.status,
        scopes: record.scopes,
        rateLimitPerMinute: record.rateLimitPerMinute,
        expiresAt: record.expiresAt,
        note: record.note,
        createdAt: record.createdAt,
      },
      message: "API key created. Store the rawKey securely — it will not be shown again.",
    });
  } catch (error) {
    console.error("[POST /api/v1/admin/api-keys]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
