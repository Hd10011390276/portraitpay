
/**
 * POST /api/portraits/[id]/certify
 * Blockchain certification flow (local-first):
 *  1. Validate portrait ownership + status
 *  2. Use pre-computed SHA-256 hash (from client)
 *  3. Upload metadata JSON to IPFS (Pinata)
 *  4. Mint on Base Mainnet (Ethers.js)
 *  5. Store txHash + ipfsCid in DB
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { certifyPortrait, SUPPORTED_NETWORKS } from "@/lib/blockchain";
import { uploadJsonToIpfs, buildPortraitMetadata } from "@/lib/ipfs";
import { sendPortraitCertifiedEmail } from "@/lib/email";
export const dynamic = "force-dynamic";


type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Use Bearer token + cookie auth to match other portrait routes
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const network = "sepolia" as const;

    // ── Step 1: Fetch portrait ──────────────────────────────────
    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      include: { owner: { select: { walletAddress: true, email: true, name: true } } },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    console.log(`[Certify] ownerId=${portrait.ownerId} session.userId=${session.userId} match=${portrait.ownerId === session.userId} role=${session.role}`);
    if (portrait.ownerId !== session.userId && session.role !== "ADMIN") {
      console.error("[Certify] Forbidden: portrait.ownerId=", portrait.ownerId, "session.userId=", session.userId);
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Note: blockchain certification uses the platform wallet (ETH_WALLET_PRIVATE_KEY), not the user's wallet.
    // The owner.walletAddress field is only for display purposes and is not required for certification.

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

    // ── Step 3: Verify imageHash exists ────────────────────────────
    const imageHash = portrait.imageHash;
    if (!imageHash) {
      return NextResponse.json(
        { success: false, error: "No image hash found. Please upload a portrait first.", code: "PP-4001" },
        { status: 400 }
      );
    }

    // ── Step 4: Upload metadata JSON to IPFS (no image data) ─────
    let metadataIpfsResult;
    const contractAddress = SUPPORTED_NETWORKS[network].contractAddress;
    const metadata = buildPortraitMetadata(
      {
        ...portrait,
        imageHash,
        ipfsCid: null,
        blockchainTxHash: null,
        certifiedAt: null,
      },
      contractAddress,
      network
    );

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

    // ── Step 5: Mint on Sepolia ─────────────────────────────
    let certificationResult;
    try {
      const cfg = SUPPORTED_NETWORKS[network];
      console.log(`[Certify] RPC=${cfg.rpcUrl} contract=${cfg.contractAddress}`);
      certificationResult = await certifyPortrait(metadataIpfsResult.cid, imageHash, network);
      console.log(`[Certify] ✅ Blockchain certified! Tx: ${certificationResult.txHash}`);
    } catch (err) {
      console.error("[Certify] Blockchain certification failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Certify] Full error:", err);
      return NextResponse.json(
        { success: false, error: `Blockchain transaction failed: ${errMsg}` },
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

    // ── Step 10: Send email notification (non-blocking) ──────────
    if (portrait.owner?.email) {
      sendPortraitCertifiedEmail({
        name: portrait.owner.name ?? portrait.owner.email.split("@")[0],
        email: portrait.owner.email,
        portraitTitle: updated.title ?? updated.name ?? "肖像",
        imageHash,
        blockchainTxHash: certificationResult.txHash,
        ipfsCid: metadataIpfsResult.cid,
        network,
        certifiedAt: certificationResult.certifiedAt.toString(),
      });
    }

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
