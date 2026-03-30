/**
 * POST /api/portraits/[id]/upload
 * Generate presigned S3 upload URLs for original image + thumbnail
 * Client uploads directly to S3, then calls this route to store the URL
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { getPresignedUploadUrl, generateImageKey } from "@/lib/storage";
import { computeImageHash } from "@/lib/blockchain";

type RouteContext = { params: Promise<{ id: string }> };

const RegisterUploadSchema = z.object({
  originalImageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  imageHash: z.string().regex(/^[a-f0-9]{64}$/, "Must be a valid SHA-256 hex string").optional(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // ── Verify ownership ────────────────────────────────────────
    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: { ownerId: true, status: true },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (portrait.status === "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Cannot update image of an ACTIVE portrait" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = RegisterUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { originalImageUrl, thumbnailUrl, imageHash } = parsed.data;

    // ── Update portrait with image URLs ─────────────────────────
    const updated = await prisma.portrait.update({
      where: { id },
      data: {
        originalImageUrl,
        thumbnailUrl: thumbnailUrl ?? originalImageUrl,
        ...(imageHash ? { imageHash } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        portraitId: updated.id,
        originalImageUrl: updated.originalImageUrl,
        thumbnailUrl: updated.thumbnailUrl,
      },
    });
  } catch (error) {
    console.error("[POST /api/portraits/[id]/upload]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portraits/[id]/upload
 * Get presigned URLs for direct browser-to-S3 upload
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: { ownerId: true, status: true },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Generate presigned URLs for original and thumbnail
    const originalKey = generateImageKey(id, "original");
    const thumbnailKey = generateImageKey(id, "thumbnail");

    const [originalUrls, thumbnailUrls] = await Promise.all([
      getPresignedUploadUrl(originalKey, "image/jpeg", 3600),
      getPresignedUploadUrl(thumbnailKey, "image/jpeg", 3600),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        original: {
          key: originalKey,
          uploadUrl: originalUrls.uploadUrl,
          objectUrl: originalUrls.objectUrl,
        },
        thumbnail: {
          key: thumbnailKey,
          uploadUrl: thumbnailUrls.uploadUrl,
          objectUrl: thumbnailUrls.objectUrl,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/portraits/[id]/upload]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
