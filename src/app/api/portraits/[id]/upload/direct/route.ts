/**
 * POST /api/portraits/[id]/upload/direct
 *
 * Server-side upload to R2 with SHA-256 hash computation.
 * No OSS, no IPFS — pure R2 + hash storage.
 *
 * For portrait photo: stores originalImageUrl + portraitImageHash
 * For ID card front:  stores idCardFront (as originalImageUrl ref) + idCardFrontHash
 *
 * Both photos are mandatory before minting.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { generateImageKey, uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function computeHash(buffer: Buffer): Promise<string> {
  // Use buffer's underlying ArrayBuffer slice to ensure correct byte range
  const arrayBuf = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuf);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

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
        { success: false, error: "Cannot update an ACTIVE portrait" },
        { status: 400 }
      );
    }

    // Parse multipart form data
    let imageBuffer: Buffer | null = null;
    let filename = "portrait.jpg";
    let uploadType = "portrait"; // "portrait" | "idcardfront"

    try {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      uploadType = (
        formData.get("type") as string ||
        formData.get("uploadType") as string ||
        "portrait"
      ).toLowerCase();

      if (!file) {
        return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        return NextResponse.json({ success: false, error: "Invalid file type. Only JPG, PNG, WebP allowed." }, { status: 400 });
      }

      filename = file.name || filename;
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);

      // Validate size: max 10MB
      if (imageBuffer.length > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "File too large. Maximum 10MB." }, { status: 400 });
      }
    } catch (formErr) {
      return NextResponse.json({ success: false, error: "Failed to parse form data" }, { status: 400 });
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ success: false, error: "Empty image" }, { status: 400 });
    }

    // Compute SHA-256 hash server-side
    const imageHash = await computeHash(imageBuffer);

    // Determine storage key
    const isIdCard = uploadType === "idcardfront";
    const key = isIdCard
      ? `portraits/${id}/idcard-front-${Date.now()}.jpg`
      : generateImageKey(id, "original");

    // Upload to R2
    let objectUrl: string;
    try {
      objectUrl = await uploadFile(imageBuffer, key, "image/jpeg");
    } catch (uploadErr) {
      const errMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
      const isConfigError = errMsg.includes("MISSING") || errMsg.includes("credential") || errMsg.includes("AccessDenied");
      const userMsg = isConfigError
        ? "图片存储服务配置错误，请联系技术支持。"
        : `图片上传失败：${errMsg.slice(0, 100)}`;
      return NextResponse.json({ success: false, error: userMsg }, { status: 500 });
    }

    // Update DB with URL + hash
    const updateData: Record<string, string> = {};

    if (isIdCard) {
      // Store ID card image URL + hash
      updateData.originalImageUrl = objectUrl;
      updateData.idCardFrontHash = imageHash;
    } else {
      // Store portrait face photo URL + hash (separate from ID card)
      updateData.portraitImageUrl = objectUrl;
      updateData.thumbnailUrl = objectUrl;
      updateData.portraitImageHash = imageHash;
    }

    const updated = await prisma.portrait.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        portraitId: updated.id,
        originalImageUrl: updated.originalImageUrl,
        portraitImageUrl: updated.portraitImageUrl,
        thumbnailUrl: updated.thumbnailUrl,
        imageHash: isIdCard ? updated.idCardFrontHash : updated.portraitImageHash,
      },
    });
  } catch (error) {
    console.error("[POST /api/portraits/[id]/upload/direct]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: "Internal server error: " + message }, { status: 500 });
  }
}