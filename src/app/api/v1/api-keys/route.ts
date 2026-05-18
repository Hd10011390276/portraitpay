
/**
 * /api/v1/api-keys - API Key Management
 *
 * GET  - List user's API keys (masked, without raw key)
 * POST - Create new API key (returns raw key once)
 * DELETE - Revoke an API key
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getSessionFromRequest } from "@/lib/auth/session";
import { createApiKey, revokeApiKey, isValidApiKeyFormat } from "@/lib/api-keys";
import { logAudit } from "@/lib/audit/service";
export const dynamic = "force-dynamic";


// GET /api/v1/api-keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.userId };
    if (status) where.status = status;

    const [apiKeys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          status: true,
          scopes: true,
          rateLimitPerMinute: true,
          lastUsedAt: true,
          requestCount: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.apiKey.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        status: key.status,
        scopes: key.scopes,
        rateLimitPerMinute: key.rateLimitPerMinute,
        lastUsedAt: key.lastUsedAt,
        requestCount: key.requestCount.toString(),
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/api-keys]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/v1/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, scopes = [], testMode = false, expiresAt } = body as {
      name?: string;
      scopes?: string[];
      testMode?: boolean;
      expiresAt?: string;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(scopes)) {
      return NextResponse.json(
        { success: false, error: "Scopes must be an array" },
        { status: 400 }
      );
    }

    // Validate scopes
    const validScopes = ["verify_portrait", "license_portrait", "read_portraits", "read_user"];
    const invalidScopes = scopes.filter((s) => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid scopes: ${invalidScopes.join(", ")}` },
        { status: 400 }
      );
    }

    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;
    if (expiresAtDate && isNaN(expiresAtDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid expiresAt date" },
        { status: 400 }
      );
    }

    const { record, rawKey } = await createApiKey(
      session.userId,
      name.trim(),
      scopes,
      testMode,
      expiresAtDate
    );

    if (!record) {
      return NextResponse.json({ success: false, error: "Failed to create API key" }, { status: 500 });
    }

    // Log the creation
    await logAudit({
      userId: session.userId,
      action: "API_KEY_CREATED",
      targetType: "ApiKey",
      targetId: record.id,
      detail: `Created API key: ${name}`,
      meta: { scopes, testMode },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        name: record.name,
        keyPrefix: record.keyPrefix,
        rawKey, // Only returned once
        status: record.status,
        scopes: record.scopes,
        rateLimitPerMinute: record.rateLimitPerMinute,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
      },
      message: "API key created. Store the rawKey securely - it will not be shown again.",
    });
  } catch (error) {
    console.error("[POST /api/v1/api-keys]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/api-keys - Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get("id");

    if (!apiKeyId) {
      return NextResponse.json(
        { success: false, error: "API key ID is required" },
        { status: 400 }
      );
    }

    const success = await revokeApiKey(apiKeyId, session.userId);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "API key not found or unauthorized" },
        { status: 404 }
      );
    }

    // Log the revocation
    await logAudit({
      userId: session.userId,
      action: "API_KEY_DELETED",
      targetType: "ApiKey",
      targetId: apiKeyId,
      detail: "Revoked API key",
    });

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/v1/api-keys]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
