/**
 * POST /api/portraits/[id]/upload
 *
 * Updates portrait with image URLs after R2 upload.
 * (SHA-256 hashes are computed in /upload/direct — this route just records URLs)
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

const UploadSchema = z.object({
  originalImageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  imageHash: z.string().optional(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = UploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
    }

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: { ownerId: true, status: true },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.portrait.update({
      where: { id },
      data: {
        ...(parsed.data.originalImageUrl && { originalImageUrl: parsed.data.originalImageUrl }),
        ...(parsed.data.thumbnailUrl && { thumbnailUrl: parsed.data.thumbnailUrl }),
        ...(parsed.data.imageHash && { imageHash: parsed.data.imageHash }),
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
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
