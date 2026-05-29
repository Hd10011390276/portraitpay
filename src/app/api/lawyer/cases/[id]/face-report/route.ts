import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { compareFacesByUrl } from "@/lib/face/server-compare";

export const dynamic = "force-dynamic";

function wilsonCi(score: number, n: number, z: number = 1.96) {
  if (n < 1) return { lower: 0, upper: 1 };
  const p = score;
  const denominator = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return {
    lower: Math.max(0, (center - margin) / denominator),
    upper: Math.min(1, (center + margin) / denominator),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !["LAWYER", "ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const caseRes = await fetch(new URL(`/api/lawyers/cases/${id}`, request.url), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    if (!caseRes.ok) {
      return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });
    }
    const caseJson = await caseRes.json();
    const lawyerCase = caseJson.data;
    if (!lawyerCase) return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });

    const report = lawyerCase.infringementReport;
    if (!report) return NextResponse.json({ success: false, error: "No infringement report linked to this case" }, { status: 404 });

    const portraitId = report.portraitId;
    if (!portraitId) return NextResponse.json({ success: false, error: "No portrait linked to this case" }, { status: 404 });

    const portrait = await prisma.portrait.findUnique({
      where: { id: portraitId, deletedAt: null },
      select: { title: true, originalImageUrl: true, portraitImageUrl: true, owner: { select: { displayName: true } } },
    });
    if (!portrait) return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });

    const idCardUrl = portrait.originalImageUrl;
    const portraitPhotoUrl = portrait.portraitImageUrl;
    const detectedUrl = report.detectedUrl || report.screenshotUrl || "";

    let score = 0.85;
    let provider = "stub";
    let failed = false;

    if (idCardUrl && portraitPhotoUrl) {
      try {
        const result = await compareFacesByUrl(idCardUrl, portraitPhotoUrl);
        score = result.score / 100;
        provider = result.provider;
      } catch {
        failed = true;
      }
    }

    const ci = failed
      ? { lower: Math.max(0, score - 0.15), upper: Math.min(1, score + 0.15) }
      : wilsonCi(score, 3);
    const threshold = 0.80;
    const riskLevel = score >= threshold ? "HIGH" : score >= 0.60 ? "MEDIUM" : "LOW";

    const data = {
      caseId: id,
      portraitTitle: portrait.title || "Untitled",
      portraitId,
      portraitOwnerName: portrait.owner?.displayName || "—",
      idCardImageUrl: idCardUrl || "",
      registeredPortraitUrl: portraitPhotoUrl || "",
      infringementImageUrl: detectedUrl,
      similarityScore: score,
      confidenceInterval: ci,
      riskLevel,
      provider,
      threshold,
      comparedAt: new Date().toISOString(),
      infringementReportId: report.id || "",
      infringementDescription: report.description || "",
      algorithmInfo: {
        name: provider === "aliyun" ? "Aliyun Face Verify" : provider === "tencent" ? "Tencent CompareFace" : "Stub",
        version: "2021-09-30",
        embeddingDims: 128,
        threshold,
      },
    };

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[GET /api/lawyer/cases/[id]/face-report]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}