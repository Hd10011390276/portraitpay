/**
 * GET /api/portraits/[id]/certificate
 * 
 * Download PNG certificate - generates on-demand
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { buildPortraitCertificate } from "@/lib/export/portrait-certificate";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    console.log('[Certificate API] Fetching portrait:', id);
    
    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
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

    // Use default values for missing fields
    const portraitTitle = portrait.title || 'Untitled';
    const idCardName = portrait.idCardName || 'Unknown';
    const idCardType = portrait.idCardType || 'id_card';
    const idCardNumber = portrait.idCardNumber || '****';
    const portraitHash = portrait.portraitImageHash || portrait.imageHash || 'N/A';
    const idCardHash = portrait.idCardFrontHash || 'N/A';
    const network = portrait.blockchainNetwork || 'sepolia';
    const certifiedAt = portrait.certifiedAt || new Date().toISOString();

    console.log('[Certificate API] Generating certificate for:', portraitTitle);

    // Generate certificate on-demand
    const pngBuffer = await buildPortraitCertificate({
      portraitId: id,
      portraitTitle,
      portraitHash,
      idCardHash,
      idCardType,
      idCardName,
      idCardNumber,
      blockchainTxHash: portrait.blockchainTxHash,
      network,
      certifiedAt: new Date(certifiedAt),
    });

    return new Response(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="portrait-certificate-${id}.png"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/portraits/[id]/certificate]", error);
    return NextResponse.json({ success: false, error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}