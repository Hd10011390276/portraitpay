import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hash = searchParams.get("hash");

  if (!hash || hash.length < 8) {
    return NextResponse.json({ found: false, error: "Invalid hash" }, { status: 400 });
  }

  try {
    // Search InfringementReport by reportHash
    const report = await prisma.infringementReport.findFirst({
      where: { reportHash: hash },
      select: {
        id: true,
        reportHash: true,
        status: true,
        type: true,
        createdAt: true,
        portrait: { select: { id: true, title: true } },
      },
    });

    if (report) {
      return NextResponse.json({
        found: true,
        source: "InfringementReport",
        data: {
          reportId: report.id,
          reportHash: report.reportHash,
          status: report.status,
          type: report.type,
          createdAt: report.createdAt.toISOString(),
          portraitTitle: report.portrait?.title || null,
        },
      });
    }

    // Search EvidenceExport by fileHash
    const evidence = await prisma.evidenceExport.findFirst({
      where: { fileHash: hash },
      select: {
        id: true,
        fileHash: true,
        exportedAt: true,
        caseId: true,
      },
    });

    if (evidence) {
      return NextResponse.json({
        found: true,
        source: "EvidenceExport",
        data: {
          evidenceId: evidence.id,
          fileHash: evidence.fileHash,
          exportedAt: evidence.exportedAt.toISOString(),
          caseId: evidence.caseId,
        },
      });
    }

    return NextResponse.json({ found: false });
  } catch (err) {
    console.error("[verify API]", err);
    return NextResponse.json({ found: false, error: "Internal error" }, { status: 500 });
  }
}
