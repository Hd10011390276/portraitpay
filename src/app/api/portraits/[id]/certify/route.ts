/**
 * POST /api/portraits/[id]/certify
 * Full blockchain certification flow:
 *  1. Validate portrait ownership + status
 *  2. Compute SHA-256 hash of image
 *  3. Upload image to IPFS
 *  4. Build metadata JSON → upload to IPFS
 *  5. Mint on Sepolia (Ethers.js)
 *  6. Store txHash + ipfsCid in DB
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { certifyPortrait, computeImageHash, SUPPORTED_NETWORKS } from "@/lib/blockchain";
import { uploadToIpfs, uploadJsonToIpfs, buildPortraitMetadata } from "@/lib/ipfs";
import { getPresignedUploadUrl, generateImageKey } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const network = "sepolia" as const;

    // ── Step 1: Fetch portrait ──────────────────────────────────
    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      include: { owner: { select: { walletAddress: true } } },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!portrait.owner.walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address not set. Please bind a wallet first.", code: "PP-2001" },
        { status: 400 }
      );
    }

    if (portrait.status !== "DRAFT" && portrait.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { success: false, error: `Portrait status '${portrait.status}' does not allow certification`, code: "PP-2002" },
        { status: 400 }
      );
    }

    if (portrait.blockchainTxHash) {
      return NextResponse.json(
        { success: false, error: "Portrait already certified on blockchain", code: "PP-3001" },
        { status: 409 }
      );
    }

    // ── Step 2: Check if imageHash already exists ────────────────
    if (portrait.imageHash) {
      const existing = await prisma.portrait.findFirst({
        where: { imageHash: portrait.imageHash, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "This image hash is already registered to another portrait", code: "PP-3001" },
          { status: 409 }
        );
      }
    }

    // ── Step 3: Fetch image from S3 presigned URL ─────────────────
    if (!portrait.originalImageUrl) {
      return NextResponse.json(
        { success: false, error: "No image uploaded for this portrait. Upload an image first." },
        { status: 400 }
      );
    }

    const imageResponse = await fetch(portrait.originalImageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch image from storage" },
        { status: 502 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // ── Step 4: Compute SHA-256 hash ──────────────────────────────
    const imageHash = await computeImageHash(imageBuffer);
    console.log(`[Certify] Image SHA-256: ${imageHash}`);

    // ── Step 5: Upload image to IPFS ─────────────────────────────
    let imageIpfsResult;
    try {
      imageIpfsResult = await uploadToIpfs(imageBuffer, `portrait-${portrait.id}.jpg`, "image/jpeg");
      console.log(`[Certify] Image uploaded to IPFS: ${imageIpfsResult.cid}`);
    } catch (err) {
      console.error("[Certify] IPFS image upload failed:", err);
      return NextResponse.json(
        { success: false, error: "IPFS image upload failed", code: "PP-5002" },
        { status: 503 }
      );
    }

    // ── Step 6: Build metadata JSON ──────────────────────────────
    const contractAddress = SUPPORTED_NETWORKS[network].contractAddress;
    const metadata = buildPortraitMetadata(
      {
        ...portrait,
        imageHash,
        ipfsCid: imageIpfsResult.cid,
        blockchainTxHash: null,
        certifiedAt: null,
      },
      contractAddress,
      network
    );

    // ── Step 7: Upload metadata JSON to IPFS ─────────────────────
    let metadataIpfsResult;
    try {
      metadataIpfsResult = await uploadJsonToIpfs(metadata, `portrait-${portrait.id}/metadata.json`);
      console.log(`[Certify] Metadata uploaded to IPFS: ${metadataIpfsResult.cid}`);
    } catch (err) {
      console.error("[Certify] IPFS metadata upload failed:", err);
      return NextResponse.json(
        { success: false, error: "IPFS metadata upload failed", code: "PP-5002" },
        { status: 503 }
      );
    }

    // ── Step 8: Mint on Sepolia ──────────────────────────────────
    let certificationResult;
    try {
      certificationResult = await certifyPortrait(metadataIpfsResult.cid, imageHash, network);
      console.log(`[Certify] ✅ Blockchain certified! Tx: ${certificationResult.txHash}`);
    } catch (err) {
      console.error("[Certify] Blockchain certification failed:", err);
      return NextResponse.json(
        { success: false, error: "Blockchain transaction failed", code: "PP-5001" },
        { status: 503 }
      );
    }

    // ── Step 9: Update DB ────────────────────────────────────────
    const updated = await prisma.portrait.update({
      where: { id },
      data: {
        imageHash,
        ipfsCid: metadataIpfsResult.cid,
        blockchainTxHash: certificationResult.txHash,
        blockchainNetwork: network,
        certifiedAt: certificationResult.certifiedAt,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        portraitId: updated.id,
        imageHash,
        ipfsCid: metadataIpfsResult.cid,
        blockchainTxHash: certificationResult.txHash,
        blockNumber: certificationResult.blockNumber,
        network,
        certifiedAt: certificationResult.certifiedAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/portraits/[id]/certify]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
