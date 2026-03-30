/**
 * POST /api/ip-register/[id]/certify
 * Certify AI IP registration on blockchain (Sepolia)
 *
 * Flow:
 *  1. Validate ownership
 *  2. Upload metadata to IPFS
 *  3. Mint certificate on-chain
 *  4. Update IPRegistration status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { certifyPortrait, computeImageHash, SUPPORTED_NETWORKS } from "@/lib/blockchain";
import { uploadToIpfs, uploadJsonToIpfs } from "@/lib/ipfs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const network = "sepolia" as const;

    // Fetch AI content + registration
    const record = await prisma.aIContent.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { walletAddress: true, displayName: true, email: true } },
        ipRegistrations: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: "AI Content not found" }, { status: 404 });
    }

    if (record.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!record.owner.walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address not set. Please bind a wallet first.", code: "IP-2001" },
        { status: 400 }
      );
    }

    const registration = record.ipRegistrations[0];
    if (!registration) {
      return NextResponse.json({ success: false, error: "No registration found" }, { status: 404 });
    }

    if (registration.status === "CERTIFIED" || registration.blockchainTxHash) {
      return NextResponse.json(
        { success: false, error: "This content is already certified on blockchain", code: "IP-3002" },
        { status: 409 }
      );
    }

    // ── Build certificate metadata ──────────────────────────────
    const contractAddress = SUPPORTED_NETWORKS[network].contractAddress;

    const certificateMetadata = {
      certificateNo: registration.certificateNo,
      title: record.title,
      description: record.description ?? undefined,
      contentType: record.contentType,
      owner: {
        address: record.owner.walletAddress,
        name: record.owner.displayName ?? undefined,
        email: record.owner.email,
      },
      generationTool: record.generationTool ?? undefined,
      generationPrompt: record.generationPrompt ?? undefined,
      generationDate: record.generationDate?.toISOString() ?? undefined,
      modelVersion: record.modelVersion ?? undefined,
      contentHash: record.contentHash ?? undefined,
      rightsDeclared: registration.rightsDeclared,
      territorialScope: registration.territorialScope,
      exclusivity: registration.exclusivity,
      certificateType: registration.certificateType,
      createdAt: registration.createdAt.toISOString(),
      platform: "PortraitPay AI",
      blockchain: {
        network,
        contractAddress,
        standard: "EIP-721",
      },
    };

    // ── Upload metadata to IPFS ─────────────────────────────────
    let metadataIpfsResult;
    try {
      metadataIpfsResult = await uploadJsonToIpfs(
        certificateMetadata as unknown as Parameters<typeof uploadJsonToIpfs>[0],
        `ip-cert-${id}/certificate-${registration.certificateNo}.json`
      );
    } catch (err) {
      console.error("[IP Certify] IPFS metadata upload failed:", err);
      return NextResponse.json(
        { success: false, error: "IPFS metadata upload failed", code: "IP-5001" },
        { status: 503 }
      );
    }

    // ── Mint on Sepolia ─────────────────────────────────────────
    const imageHash = record.contentHash ?? (new Date().getTime().toString(16));
    let certifyResult;
    try {
      certifyResult = await certifyPortrait(metadataIpfsResult.cid, imageHash, network);
    } catch (err) {
      console.error("[IP Certify] Blockchain certification failed:", err);
      return NextResponse.json(
        { success: false, error: "Blockchain transaction failed. Please try again.", code: "IP-5002" },
        { status: 503 }
      );
    }

    // ── Update database ─────────────────────────────────────────
    await prisma.iPRegistration.update({
      where: { id: registration.id },
      data: {
        blockchainTxHash: certifyResult.txHash,
        blockchainBlockNum: certifyResult.blockNumber,
        contractAddress,
        certificateIpfsCid: metadataIpfsResult.cid,
        metadataIpfsCid: metadataIpfsResult.cid,
        certifiedAt: certifyResult.certifiedAt,
        status: "CERTIFIED",
        expiresAt: registration.exclusivity ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      },
    });

    // Update AI content IPFS CID
    await prisma.aIContent.update({
      where: { id },
      data: { ipfsCid: metadataIpfsResult.cid },
    });

    return NextResponse.json({
      success: true,
      data: {
        registrationId: registration.id,
        certificateNo: registration.certificateNo,
        certificateIpfsCid: metadataIpfsResult.cid,
        blockchainTxHash: certifyResult.txHash,
        blockNumber: certifyResult.blockNumber,
        network,
        certifiedAt: certifyResult.certifiedAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/ip-register/[id]/certify]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
