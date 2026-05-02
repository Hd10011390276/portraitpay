
/**
 * POST /api/portraits/[id]/upload
 * Generate presigned S3 upload URLs for original image + thumbnail
 * Client uploads directly to S3, then calls this route to store the URL
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, getSessionFromRequest } from "@/lib/auth/session";
import { getPresignedUploadUrl, generateImageKey } from "@/lib/storage";
import { computeImageHash } from "@/lib/blockchain";
import { uploadToIpfs, getIpfsGatewayUrl } from "@/lib/ipfs/index";
export const dynamic = "force-dynamic";


type RouteContext = { params: Promise<{ id: string }> };

const RegisterUploadSchema = z.object({
  originalImageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  imageHash: z.string().regex(/^[a-f0-9]{64}$/, "Must be a valid SHA-256 hex string").optional(),
  idCardFrontUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
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

    if (portrait.ownerId !== session.userId) {
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

    const { originalImageUrl, thumbnailUrl, imageHash, idCardFrontUrl } = parsed.data;

    // ── Update portrait with image URLs ─────────────────────────
    const updated = await prisma.portrait.update({
      where: { id },
      data: {
        originalImageUrl,
        thumbnailUrl: thumbnailUrl ?? originalImageUrl,
        ...(imageHash ? { imageHash } : {}),
        ...(idCardFrontUrl ? { idCardFrontUrl } : {}),
      },
    });

    // ── Upload image to IPFS via Pinata ─────────────────────────
    let ipfsCid: string | null = null;
    if (originalImageUrl && process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
      try {
        console.log(`[IPFS] Fetching image from S3: ${originalImageUrl}`);
        const s3Res = await fetch(originalImageUrl);
        if (!s3Res.ok) throw new Error(`Failed to fetch image from S3: ${s3Res.status}`);
        const imageBuffer = await s3Res.arrayBuffer();
        const uint8 = new Uint8Array(imageBuffer);

        console.log(`[IPFS] Uploading to Pinata for portrait ${id}`);
        const ipfsResult = await uploadToIpfs(uint8, `portrait-${id}.jpg`, "image/jpeg");
        ipfsCid = ipfsResult.cid;
        console.log(`[IPFS] Uploaded successfully. CID: ${ipfsCid}`);

        // Save IPFS CID to portrait record
        await prisma.portrait.update({
          where: { id },
          data: { ipfsCid },
        });
      } catch (ipfsErr) {
        // IPFS failure should not block the upload — log and continue
        console.error(`[IPFS] Upload failed for portrait ${id}:`, ipfsErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        portraitId: updated.id,
        originalImageUrl: updated.originalImageUrl,
        thumbnailUrl: updated.thumbnailUrl,
        ipfsCid,
        ipfsGatewayUrl: ipfsCid ? getIpfsGatewayUrl(ipfsCid) : null,
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
