/**
 * POST /api/infringements/[id]/capture — Capture evidence screenshots for a report
 *
 * Takes screenshot of each evidence URL, stores in R2, records EvidencePackage.
 * Optional body: { urls: string[] } for additional URLs beyond what's in the report.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { captureEvidence } from "@/lib/infringement/evidence";

export const dynamic = "force-dynamic";

const CaptureSchema = z.object({
  urls: z.array(z.string().url()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const report = await prisma.infringementReport.findUnique({ where: { id } });

  if (!report) {
    return NextResponse.json(
      { success: false, error: "Report not found" },
      { status: 404 }
    );
  }

  const isAdmin =
    session.role === "ADMIN" || session.role === "VERIFIER";
  if (report.reporterId !== session.userId && !isAdmin) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CaptureSchema.safeParse(body);
  const extraUrls = parsed.success ? (parsed.data.urls ?? []) : [];

  const allUrls = [
    report.detectedUrl,
    ...(report.evidenceUrls ?? []),
    ...extraUrls,
  ].filter((u): u is string => !!u && typeof u === "string");

  const uniqueUrls = allUrls.filter((url, i) => allUrls.indexOf(url) === i);

  const results: Array<{
    url: string;
    evidenceUrl: string;
    contentHash: string;
    pageSnapshotUrl?: string;
    pageTitle?: string;
    error?: string;
  }> = [];

  for (const url of uniqueUrls) {
    try {
      const captured = await captureEvidence(url, {
        reportId: id,
        capturedBy: session.userId,
      });
      results.push({
        url,
        evidenceUrl: captured.evidenceUrl,
        contentHash: captured.contentHash,
        pageSnapshotUrl: captured.pageSnapshotUrl,
        pageTitle: captured.pageTitle,
      });
    } catch (err) {
      results.push({
        url,
        evidenceUrl: "",
        contentHash: "",
        error: err instanceof Error ? err.message : "Capture failed",
      });
    }
  }

  return NextResponse.json({ success: true, data: results });
}
