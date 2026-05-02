/**
 * POST /api/portraits/[id]/upload/direct
 * Upload portrait image directly through this API route (server-side → R2)
 * Avoids CORS issues from direct browser-to-R2 upload
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { generateImageKey, uploadFile } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
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

    if (portrait.ownerId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (portrait.status === "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Cannot update image of an ACTIVE portrait" },
        { status: 400 }
      );
    }

    // Parse multipart form data
    let imageBuffer: Buffer | null = null;
    let filename = "portrait.jpg";
    let uploadType = "portrait"; // "portrait" or "idCardFront"

    try {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      uploadType = (formData.get("type") as string) || "portrait";
      if (!file) {
        return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
      }
      filename = file.name || filename;
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } catch (formErr) {
      return NextResponse.json({ success: false, error: "Failed to parse form data" }, { status: 400 });
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ success: false, error: "Empty image" }, { status: 400 });
    }

    // Generate storage key based on upload type
    const isIdCard = uploadType === "idCardFront";
    const key = isIdCard
      ? `portraits/${id}/idcard-front-${Date.now()}.jpg`
      : generateImageKey(id, "original");

    // Upload to R2
    let objectUrl: string;
    try {
      objectUrl = await uploadFile(imageBuffer, key, "image/jpeg");
    } catch (uploadErr) {
      console.error("[upload/direct] R2 upload failed:", uploadErr);
      return NextResponse.json({ success: false, error: "Upload to storage failed" }, { status: 500 });
    }

    // Update portrait record based on upload type
    const updateData: Record<string, string> = isIdCard
      ? { idCardFrontUrl: objectUrl }
      : { originalImageUrl: objectUrl, thumbnailUrl: objectUrl };

    const updated = await prisma.portrait.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        portraitId: updated.id,
        originalImageUrl: updated.originalImageUrl,
        thumbnailUrl: updated.thumbnailUrl,
        idCardFrontUrl: updated.idCardFrontUrl,
      },
    });
  } catch (error) {
    console.error("[POST /api/portraits/[id]/upload/direct]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
