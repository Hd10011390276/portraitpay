/**
 * POST /api/portraits/[id]/mint
 *
 * Mint a portrait NFT on the Ethereum Sepolia testnet.
 * This is the server-side API that:
 *  1. Validates session and portrait ownership
 *  2. Uploads metadata JSON to IPFS (Pinata)
 *  3. Calls PortraitCert.certifyPortrait on Sepolia
 *  4. Saves txHash + ipfsCid to the Portrait record in Prisma
 *
 * The client-side mint page calls this API rather than signing directly,
 * so the burner wallet private key stays server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { certifyPortrait, SUPPORTED_NETWORKS } from "@/lib/blockchain";
import { uploadJsonToIpfs, buildPortraitMetadata } from "@/lib/ipfs";
import { sendPortraitCertifiedEmail } from "@/lib/email";
import { kycService } from "@/lib/kyc/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/portraits/[id]/mint
 *
 * Body (optional fields, auto-detected if omitted):
 *   { imageHash?: string; ipfsCid?: string }
 *
 * Returns:
 *   { success: true, data: { portraitId, imageHash, ipfsCid, blockchainTxHash, blockNumber, network, certifiedAt } }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // ── Fetch portrait ─────────────────────────────────────────────────────
    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        originalImageUrl: true,
        thumbnailUrl: true,
        imageHash: true,
        blockchainTxHash: true,
        ipfsCid: true,
        status: true,
        faceEmbedding: true,
        idCardFrontUrl: true,
        faceVerifiedAt: true,
        owner: { select: { walletAddress: true, email: true, name: true } },
      },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    // Ownership check
    if (portrait.ownerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // ── Pre-flight validation ─────────────────────────────────────────────
    if (portrait.status !== "DRAFT" && portrait.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        {
          success: false,
          error: `Portrait status '${portrait.status}' does not allow minting`,
          code: "PP-2002",
        },
        { status: 400 }
      );
    }

    if (portrait.blockchainTxHash) {
      return NextResponse.json(
        { success: false, error: "Portrait already minted on blockchain", code: "PP-3001" },
        { status: 409 }
      );
    }

    // ── Image hash (from DB or body) ──────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const imageHash = body.imageHash ?? portrait.imageHash;

    if (!imageHash) {
      return NextResponse.json(
        { success: false, error: "No image hash found. Please upload a portrait first.", code: "PP-4001" },
        { status: 400 }
      );
    }

    // ── Face Verification ────────────────────────────────────────────────────
    // If portrait was already verified at upload time (faceVerifiedAt is set), skip re-verification
    // Otherwise do full KYC-based face verification
    if (!portrait.faceVerifiedAt) {
      console.log("[Mint] Portrait not verified at upload time, running KYC face verification...");
      try {
        const verifyResult = await kycService.verifyFaceForMint(
          session.userId,
          portrait.originalImageUrl ?? "",
          portrait.idCardFrontUrl ?? undefined
        );
        console.log("[Mint] Face verification passed!", verifyResult.faceResult);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const code = err instanceof Error ? (err as any).code : undefined;

        console.error("[Mint] Face verification failed:", errMsg, "code:", code);

        if (code === "PORTRAIT_IMAGE_MISSING") {
          return NextResponse.json(
            { success: false, error: "请先上传肖像照片后再上链。", code: "PP-FACE-003" },
            { status: 400 }
          );
        }

        if (code === "ID_CARD_MISSING") {
          return NextResponse.json(
            { success: false, error: "请先上传身份证照片后再上链。", code: "PP-FACE-004" },
            { status: 400 }
          );
        }

        if (code === "FACE_MISMATCH" || errMsg.includes("人脸核身")) {
          console.log("[Mint] Sending face mismatch failure email...");
          const { sendPortraitMintFailedEmail } = await import("@/lib/email");
          if (portrait.owner?.email) {
            sendPortraitMintFailedEmail({
              name: portrait.owner.name ?? portrait.owner.email.split("@")[0],
              email: portrait.owner.email,
              portraitTitle: portrait.title ?? "肖像",
              reason: "人脸与身份证信息不匹配，区块链上链被拒绝。请重新上传清晰的人脸照片和身份证信息。",
            }).catch((e: unknown) => console.error("[Mint] Failed to send failure email:", e));
          }
          return NextResponse.json(
            { success: false, error: "人脸与身份证信息不匹配，区块链上链被拒绝。请重新上传清晰的人脸照片。", code: "PP-FACE-001" },
            { status: 403 }
          );
        }

        if (code === "OCR_NOT_FOUND" || code === "KYC_NOT_APPROVED" || errMsg.includes("KYC")) {
          return NextResponse.json(
            { success: false, error: "请先完成身份认证后再上链。", code: "PP-KYC-001" },
            { status: 403 }
          );
        }

        // Other errors
        return NextResponse.json(
          { success: false, error: "身份核验失败：" + errMsg, code: "PP-FACE-002" },
          { status: 500 }
        );
      }
    } else {
      console.log("[Mint] Portrait already verified at upload time, skipping KYC check. faceVerifiedAt:", portrait.faceVerifiedAt);
    }

    const network = "sepolia" as const;
    const contractAddress = SUPPORTED_NETWORKS[network].contractAddress;

    // ── Build & upload metadata to IPFS ───────────────────────────────────
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

    let metadataIpfsResult;
    try {
      metadataIpfsResult = await uploadJsonToIpfs(
        metadata,
        `portrait-${portrait.id}/metadata.json`
      );
      console.log(`[Mint] Metadata uploaded to IPFS: ${metadataIpfsResult.cid}`);
    } catch (err) {
      console.error("[Mint] IPFS metadata upload failed:", err);
      return NextResponse.json(
        { success: false, error: "IPFS metadata upload failed", code: "PP-5002" },
        { status: 503 }
      );
    }

    // ── Mint on Sepolia ────────────────────────────────────────────────────
    let certificationResult;
    try {
      certificationResult = await certifyPortrait(
        metadataIpfsResult.cid,
        imageHash,
        network
      );
      console.log(`[Mint] ✅ Minted on Sepolia! Tx: ${certificationResult.txHash}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Mint] Blockchain mint failed:", errMsg);

      // Check if this imageHash was already certified on-chain (by any portrait)
      if (errMsg.includes("already registered") || errMsg.includes("already minted")) {
        const existingPortrait = await prisma.portrait.findFirst({
          where: { imageHash, blockchainTxHash: { not: null } },
          select: {
            id: true,
            title: true,
            imageHash: true,
            blockchainTxHash: true,
            blockchainNetwork: true,
            ipfsCid: true,
            certifiedAt: true,
          },
        });

        if (existingPortrait) {
          // Update THIS portrait with the existing blockchain data instead of re-minting
          const updated = await prisma.portrait.update({
            where: { id },
            data: {
              imageHash,
              ipfsCid: existingPortrait.ipfsCid,
              blockchainTxHash: existingPortrait.blockchainTxHash,
              blockchainNetwork: existingPortrait.blockchainNetwork,
              certifiedAt: existingPortrait.certifiedAt,
              status: "ACTIVE",
            },
          });

          console.log(`[Mint] Reusing existing blockchain certificate from portrait ${existingPortrait.id}`);
          return NextResponse.json({
            success: true,
            data: {
              portraitId: updated.id,
              imageHash,
              ipfsCid: existingPortrait.ipfsCid,
              blockchainTxHash: existingPortrait.blockchainTxHash,
              blockNumber: null,
              network: existingPortrait.blockchainNetwork ?? network,
              certifiedAt: existingPortrait.certifiedAt,
              reusedCertificate: true,
            },
          });
        }
      }

      return NextResponse.json(
        { success: false, error: "区块链上链失败：" + errMsg, code: "PP-5001" },
        { status: 503 }
      );
    }

    // ── Update DB ─────────────────────────────────────────────────────────
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

    // ── Send email notification (non-blocking, with certificate PDF) ───────────
    if (portrait.owner?.email) {
      const { sendPortraitCertifiedEmail: sendEmailWithCert } = await import("@/lib/email");
      const { buildPortraitCertificate } = await import("@/lib/export/portrait-certificate");
      const path = await import("path");

      const certNo = `PPC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const templatePath = path.join(process.cwd(), "public", "images", "blockchain-certificate-template.png");
      const ownerName = portrait.owner.name ?? portrait.owner.email.split("@")[0];

      let certBuffer: Buffer | undefined;
      try {
        certBuffer = await buildPortraitCertificate(
          {
            portraitTitle: updated.title ?? "Portrait",
            ownerName,
            ownerEmail: portrait.owner.email,
            imageHash,
            blockchainTxHash: certificationResult.txHash,
            ipfsCid: metadataIpfsResult.cid,
            network,
            certifiedAt: certificationResult.certifiedAt,
            certificateNo: certNo,
          },
          templatePath
        ) as unknown as Buffer;
      } catch (e) {
        console.error("[Mint] Certificate generation failed (non-blocking):", e);
      }

      sendEmailWithCert({
        name: ownerName,
        email: portrait.owner.email,
        portraitTitle: updated.title ?? "Portrait",
        imageHash,
        blockchainTxHash: certificationResult.txHash,
        ipfsCid: metadataIpfsResult.cid,
        network,
        certifiedAt: certificationResult.certifiedAt.toString(),
        certificateBuffer: certBuffer,
        certificateNo: certNo,
      }).catch((e: unknown) => console.error("[Mint] Failed to send certified email:", e));
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
    console.error("[POST /api/portraits/[id]/mint]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
