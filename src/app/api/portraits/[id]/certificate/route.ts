/**
 * GET /api/portraits/[id]/certificate
 *
 * Generate and download the blockchain certificate PDF for a minted portrait.
 * Requires authentication. Portrait must be minted (ACTIVE with blockchainTxHash).
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { buildPortraitCertificate } from "@/lib/export/portrait-certificate";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function generateCertificateNo(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PPC-${y}${m}${d}-${rand}`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { displayName: true, email: true, name: true } },
      },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    // Only owner or admin can download
    if (portrait.ownerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Must be minted
    if (!portrait.blockchainTxHash) {
      return NextResponse.json(
        { success: false, error: "Portrait has not been minted on blockchain yet" },
        { status: 400 }
      );
    }

    const ownerName = portrait.owner.displayName ?? portrait.owner.name ?? portrait.owner.email?.split("@")[0] ?? "Unknown";
    const ownerEmail = portrait.owner.email ?? "";
    const certificateNo = generateCertificateNo();

    // Template path — use absolute path to public/images
    const templatePath = path.join(process.cwd(), "public", "images", "blockchain-certificate-template.png");

    const pdfBuffer = await buildPortraitCertificate(
      {
        portraitTitle: portrait.title,
        ownerName,
        ownerEmail,
        imageHash: portrait.imageHash ?? "",
        blockchainTxHash: portrait.blockchainTxHash,
        ipfsCid: portrait.ipfsCid ?? "",
        network: portrait.blockchainNetwork ?? "sepolia",
        certifiedAt: portrait.certifiedAt ?? new Date(),
        certificateNo,
      },
      templatePath
    );

    const safeName = (portrait.title ?? "portrait").replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="portrait-certificate-${safeName}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[GET /api/portraits/[id]/certificate]", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}