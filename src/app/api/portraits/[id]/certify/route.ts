/**
 * POST /api/portraits/[id]/certify
 *
 * Alias for /api/portraits/[id]/mint
 * The portrait detail page still calls /certify — we forward to the mint route.
 * Both routes do the same thing: blockchain timestamp certification.
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
        id: true, ownerId: true, title: true, originalImageUrl: true, thumbnailUrl: true,
        portraitImageHash: true, idCardFrontHash: true, blockchainTxHash: true, status: true,
        idCardType: true, idCardName: true, idCardNumber: true,
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
      certificationResult = await certifyPortrait(blockchainRef, portraitImageHash, network);
      console.log(`[Certify] ✅ Certified on Sepolia! Tx: ${certificationResult.txHash} | Ref: ${blockchainRef}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Certify] Blockchain mint failed:", errMsg);
      return NextResponse.json({ success: false, error: `Blockchain certification failed: ${errMsg}` }, { status: 500 });
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

    // Build PNG certificate
    let certificateUrl = "";
    try {
      const certData = await buildPortraitCertificate({
        portraitId: id,
        portraitTitle: portrait.title,
        portraitHash: portraitImageHash,
        idCardHash: idCardFrontHash,
        idCardType,
        idCardName,
        idCardNumber,
        blockchainTxHash: certificationResult.txHash,
        certifiedAt: certificationResult.certifiedAt,
        network,
      });
      certificateUrl = certData.url;
    } catch (certErr) {
      console.error("[Certify] Certificate build failed:", certErr);
    }

    // Send email
    try {
      await sendPortraitCertifiedEmail({
        portraitId: id,
        portraitTitle: portrait.title,
        ownerEmail: portrait.owner.email!,
        ownerName: portrait.owner.name ?? portrait.owner.displayName ?? "User",
        portraitHash: portraitImageHash,
        idCardHash: idCardFrontHash,
        idCardType,
        idCardName,
        idCardNumber,
        blockchainTxHash: certificationResult.txHash,
        certifiedAt: certificationResult.certifiedAt,
        network,
        certificateUrl,
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