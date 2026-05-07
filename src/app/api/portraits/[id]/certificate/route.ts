/**
 * GET /api/portraits/[id]/certificate
 * Download PNG certificate
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { buildCertificateImage } from "@/lib/export/portrait-certificate";

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
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!portrait.blockchainTxHash) {
      return NextResponse.json({ success: false, error: "Portrait not certified" }, { status: 400 });
    }

    const pngBuffer = await buildCertificateImage({
      portraitTitle: portrait.title || 'Untitled',
      portraitHash: portrait.portraitImageHash || portrait.imageHash || '',
      idCardHash: portrait.idCardFrontHash || '',
      blockchainTxHash: portrait.blockchainTxHash,
      network: portrait.blockchainNetwork || 'sepolia',
      certifiedAt: portrait.certifiedAt ? new Date(portrait.certifiedAt) : new Date(),
      idCardName: portrait.idCardName || 'Unknown',
      idCardType: portrait.idCardType || 'ID Card',
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