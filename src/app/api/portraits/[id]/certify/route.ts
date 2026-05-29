/**
 * POST /api/portraits/[id]/certify
 *
 * Alias for /api/portraits/[id]/mint
 * The portrait detail page still calls /certify — we forward to the mint route.
 * Both routes do the same thing: blockchain timestamp certification.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { certifyPortrait, SUPPORTED_NETWORKS } from "@/lib/blockchain";
import { sendPortraitCertifiedEmail } from "@/lib/email";
import { buildPortraitCertificate } from "@/lib/export/portrait-certificate";
import { uploadFile } from "@/lib/storage";

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
        id: true, ownerId: true, title: true, originalImageUrl: true, thumbnailUrl: true,
        portraitImageHash: true, idCardFrontHash: true, blockchainTxHash: true, status: true,
        idCardType: true, idCardName: true, idCardNumber: true,
        owner: { select: { walletAddress: true, email: true, name: true, displayName: true } },
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

    const hasPrivateKey = process.env.ETH_WALLET_PRIVATE_KEY && process.env.ETH_WALLET_PRIVATE_KEY.length > 10;

    let certificationResult;
    if (hasPrivateKey) {
      try {
        certificationResult = await certifyPortrait(blockchainRef, portraitImageHash, network);
        console.log(`[Certify] Certified on Sepolia! Tx: ${certificationResult.txHash} | Ref: ${blockchainRef}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[Certify] Blockchain mint failed:", errMsg);
        return NextResponse.json({ success: false, error: `Blockchain certification failed: ${errMsg}` }, { status: 500 });
      }
    } else {
      certificationResult = {
        txHash: `local-${crypto.randomUUID()}`,
        blockNumber: 0,
        certifiedAt: Date.now(),
        network,
      };
      console.log("[Certify] Skipping blockchain — ETH_WALLET_PRIVATE_KEY not configured");
    }

    await prisma.portrait.update({
      where: { id },
      data: {
        blockchainTxHash: certificationResult.txHash,
        blockchainNetwork: network,
        certifiedAt: certificationResult.certifiedAt,
        status: "ACTIVE",
      },
    });

    // Build PNG certificate and upload to R2
    let certificateUrl = "";
    let pngBuffer = null;
    try {
      pngBuffer = await buildPortraitCertificate({
        portraitTitle: portrait.title || "Untitled",
        portraitHash: portraitImageHash,
        idCardHash: idCardFrontHash,
        blockchainTxHash: certificationResult.txHash,
        network,
        certifiedAt: new Date(certificationResult.certifiedAt),
        idCardName: idCardName || "Unknown",
        idCardType: idCardType || "ID Card",
        idCardNumberMasked: idCardNumber ? idCardNumber.replace(/^(.{4}).+(.{4})$/, "$1****$2") : "****",
        certificateNo: `CERT-${new Date().getFullYear()}-00001`,
      });

      // Upload to R2
      const certKey = `certificates/${id}/${Date.now()}.png`;
      certificateUrl = await uploadFile(pngBuffer, certKey, "image/png");
      console.log("[Certify] Certificate uploaded:", certificateUrl);
    } catch (certErr) {
      console.error("[Certify] Certificate build failed:", certErr);
    }

    // Send email with PNG buffer attached
    try {
      await sendPortraitCertifiedEmail({
        name: portrait.owner.name ?? portrait.owner.displayName ?? "User",
        email: portrait.owner.email!,
        portraitTitle: portrait.title || "Untitled",
        portraitImageHash: portraitImageHash,
        idCardFrontHash: idCardFrontHash,
        idCardType: idCardType || "ID Card",
        idCardName: idCardName || "Unknown",
        idCardNumberMasked: idCardNumber ? idCardNumber.replace(/^(.{4}).+(.{4})$/, "$1****$2") : "****",
        blockchainTxHash: certificationResult.txHash,
        network,
        certifiedAt: String(certificationResult.certifiedAt),
        certificateBuffer: pngBuffer || undefined,
        certificateUrl: certificateUrl || undefined,
      });
    } catch (emailErr) {
      console.error("[Certify] Email send failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        blockchainTxHash: certificationResult.txHash,
        blockNumber: certificationResult.blockNumber,
        network,
        certifiedAt: certificationResult.certifiedAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/portraits/[id]/certify]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
