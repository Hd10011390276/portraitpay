/**
 * POST /api/portraits/[id]/mint
 *
 * Zero-cost blockchain timestamp certification.
 *
 * Flow:
 *  1. Read SHA-256 hashes already stored at upload time
 *  2. Require idCardType + idCardName + idCardNumber in body
 *  3. Build composite ref = pp:${portraitHash}:${idCardHash}
 *  4. Call PortraitCert.certifyPortrait on Sepolia
 *  5. Save txHash to Portrait record
 *  6. Send certificate PDF email with both hashes + ID info
 *
 * No IPFS, no KYC, no CompareFace — pure blockchain timestamp proof.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { certifyPortrait, SUPPORTED_NETWORKS } from "@/lib/blockchain";
import { sendPortraitCertifiedEmail } from "@/lib/email";
import { buildPortraitCertificate } from "@/lib/export/portrait-certificate";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        title: true,
        originalImageUrl: true,
        thumbnailUrl: true,
        portraitImageHash: true,
        idCardFrontHash: true,
        blockchainTxHash: true,
        status: true,
        idCardType: true,
        idCardName: true,
        idCardNumber: true,
        owner: { select: { walletAddress: true, email: true, name: true } },
      },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (portrait.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: `Portrait status '${portrait.status}' does not allow minting`, code: "PP-2002" },
        { status: 400 }
      );
    }

    if (portrait.blockchainTxHash) {
      return NextResponse.json(
        { success: false, error: "Portrait already certified on blockchain", code: "PP-3001" },
        { status: 409 }
      );
    }

    const portraitImageHash = body.portraitImageHash ?? portrait.portraitImageHash;
    const idCardFrontHash = body.idCardFrontHash ?? portrait.idCardFrontHash;

    if (!portraitImageHash) {
      return NextResponse.json(
        { success: false, error: "Portrait photo not uploaded yet. Please upload a photo first.", code: "PP-4001" },
        { status: 400 }
      );
    }

    if (!idCardFrontHash) {
      return NextResponse.json(
        { success: false, error: "ID card not uploaded yet. Please upload your ID card first.", code: "PP-4002" },
        { status: 400 }
      );
    }

    const idCardType = body.idCardType ?? portrait.idCardType;
    const idCardName = body.idCardName ?? portrait.idCardName;
    const idCardNumber = body.idCardNumber ?? portrait.idCardNumber;

    if (!idCardType || !idCardName || !idCardNumber) {
      return NextResponse.json(
        { success: false, error: "Missing ID info: idCardType, idCardName, idCardNumber are required.", code: "PP-4003" },
        { status: 400 }
      );
    }

    await prisma.portrait.update({
      where: { id },
      data: { idCardType, idCardName, idCardNumber },
    });

    const blockchainRef = `pp:${portraitImageHash.slice(0, 16)}:${idCardFrontHash.slice(0, 16)}`;
    const network = "sepolia" as const;

    let certificationResult;
    try {
      certificationResult = await certifyPortrait(
        blockchainRef,
        portraitImageHash,
        network
      );
      console.log(`[Mint] ✅ Certified on Sepolia! Tx: ${certificationResult.txHash} | Ref: ${blockchainRef}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Mint] Blockchain mint failed:", errMsg);

      if (errMsg.includes("already registered") || errMsg.includes("already minted") || errMsg.includes("Already certified")) {
        // Find any portrait with the same image hash (already on blockchain)
        const existingPortrait = await prisma.portrait.findFirst({
          where: { portraitImageHash },
          select: {
            id: true, portraitImageHash: true, blockchainTxHash: true,
            blockchainNetwork: true, certifiedAt: true,
          },
        });

        if (existingPortrait) {
          const updated = await prisma.portrait.update({
            where: { id },
            data: {
              portraitImageHash,
              idCardFrontHash,
              idCardType,
              idCardName,
              idCardNumber,
              blockchainTxHash: existingPortrait.blockchainTxHash ?? `reused:${portraitImageHash.slice(0, 16)}`,
              blockchainNetwork: existingPortrait.blockchainNetwork ?? network,
              certifiedAt: existingPortrait.certifiedAt ?? new Date(),
              status: "ACTIVE",
            },
          });

          return NextResponse.json({
            success: true,
            data: {
              portraitId: updated.id,
              portraitImageHash,
              idCardFrontHash,
              blockchainTxHash: existingPortrait.blockchainTxHash,
              network: existingPortrait.blockchainNetwork ?? network,
              certifiedAt: existingPortrait.certifiedAt,
              reusedCertificate: true,
            },
          });
        }
      }

      return NextResponse.json(
        { success: false, error: "Blockchain certification failed: " + errMsg, code: "PP-5001" },
        { status: 503 }
      );
    }

    // Assign sequential certificate number atomically
    const counter = await prisma.$transaction(async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE "CertificateCounter"
        SET "nextNumber" = "nextNumber" + 1
        WHERE id = 'global'
        RETURNING "nextNumber"
      `;
      return updated[0]?.nextNumber ?? null;
    });

    if (!counter) {
      return NextResponse.json(
        { success: false, error: "Failed to generate certificate number" },
        { status: 500 }
      );
    }

    const certificateNumber = counter - 1;
    const certNo = `CERT-${new Date().getFullYear()}-${String(certificateNumber).padStart(5, "0")}`;
    const isEarlyContributor = certificateNumber <= 1000;

    const updated = await prisma.portrait.update({
      where: { id },
      data: {
        portraitImageHash,
        idCardFrontHash,
        idCardType,
        idCardName,
        idCardNumber,
        blockchainTxHash: certificationResult.txHash,
        blockchainNetwork: network,
        certifiedAt: certificationResult.certifiedAt,
        status: "ACTIVE",
        certificateNumber,
      },
    });

    if (portrait.owner?.email) {
      const { sendPortraitCertifiedEmail } = await import("@/lib/email");
      const { buildPortraitCertificate } = await import("@/lib/export/portrait-certificate");

      const rawNumber = String(idCardNumber);
      const maskedNumber = rawNumber.length > 7
        ? rawNumber.slice(0, 3) + "***" + rawNumber.slice(-4)
        : "***";

      const templatePath = `${process.cwd()}/public/images/blockchain-certificate-template-final.png`;
      const ownerName = portrait.owner.name ?? portrait.owner.email.split("@")[0];

      let certBuffer: Buffer | undefined;
      try {
        certBuffer = await buildPortraitCertificate(
          {
            portraitTitle: updated.title ?? "Portrait",
            idCardName: ownerName,
            idCardType,
            idCardNumberMasked: maskedNumber,
            portraitImageHash,
            idCardFrontHash,
            blockchainTxHash: certificationResult.txHash,
            network,
            certifiedAt: certificationResult.certifiedAt,
            certificateNo: certNo,
            isEarlyContributor,
          },
          templatePath
        ) as unknown as Buffer;
      } catch (e) {
        console.error("[Mint] Certificate PDF failed (non-blocking):", e);
      }

      sendPortraitCertifiedEmail({
        name: ownerName,
        email: portrait.owner.email,
        portraitTitle: updated.title ?? "Portrait",
        portraitImageHash,
        idCardFrontHash,
        idCardName,
        idCardType,
        idCardNumberMasked: maskedNumber,
        blockchainTxHash: certificationResult.txHash,
        network,
        certifiedAt: certificationResult.certifiedAt.toString(),
        certificateBuffer: certBuffer,
        certificateNo: certNo,
        isEarlyContributor,
      }).catch((e: unknown) => console.error("[Mint] Email send failed:", e));
    }

    return NextResponse.json({
      success: true,
      data: {
        portraitId: updated.id,
        portraitImageHash,
        idCardFrontHash,
        blockchainTxHash: certificationResult.txHash,
        blockNumber: certificationResult.blockNumber,
        network,
        certifiedAt: certificationResult.certifiedAt,
        certificateNumber,
        certNo,
        isEarlyContributor,
      },
    });
  } catch (error) {
    console.error("[POST /api/portraits/[id]/mint]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
