/**
 * GET /api/portraits/[id]/certificate
 * 
 * Download PNG certificate - generates on-demand from stored R2 URL or regenerate
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { buildPortraitCertificate } from "@/lib/export/portrait-certificate";
import { storageService } from "@/lib/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        title: true,
        portraitImageHash: true,
        idCardFrontHash: true,
        idCardType: true,
        idCardName: true,
        idCardNumber: true,
        blockchainTxHash: true,
        blockchainNetwork: true,
        certifiedAt: true,
      },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!portrait.blockchainTxHash) {
      return NextResponse.json({ success: false, error: "Portrait not certified on blockchain" }, { status: 400 });
    }

    // Generate certificate on-demand
    const pngBuffer = await buildPortraitCertificate({
      portraitId: id,
      portraitTitle: portrait.title,
      portraitHash: portrait.portraitImageHash,
      idCardHash: portrait.idCardFrontHash,
      idCardType: portrait.idCardType,
      idCardName: portrait.idCardName,
      idCardNumber: portrait.idCardNumber,
      blockchainTxHash: portrait.blockchainTxHash,
      network: portrait.blockchainNetwork,
      certifiedAt: portrait.certifiedAt,
    });

    return new Response(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="portrait-certificate-${id}.png"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/portraits/[id]/certificate]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}