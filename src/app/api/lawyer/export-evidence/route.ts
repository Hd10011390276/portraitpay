import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { EvidenceDocument, type EvidenceClaimData } from "@/components/lawyer/EvidencePDF";

export const dynamic = "force-dynamic";

function generateCaseRef(caseId: string, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const idPart = caseId.slice(-6).toUpperCase();
  return `PP-${year}-${idPart}`;
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function scopeLabels(scopes: string[]): string[] {
  const map: Record<string, string> = {
    FILM: "Film & Cinema",
    ANIMATION: "Animation",
    ADVERTISING: "Advertising & Marketing",
    GAMING: "Gaming",
    PRINT: "Print Media",
    MERCHANDISE: "Merchandise",
    SOCIAL_MEDIA: "Social Media",
    EDUCATION: "Education",
    NEWS: "News & Journalism",
    VOICE: "Voice Reproduction",
    DEEPFAKE: "Deep Synthesis",
    ADULT: "Adult Content (Prohibited)",
    POLITICAL: "Political Use (Prohibited)",
    VIOLENCE: "Violent Content (Prohibited)",
    HATE: "Hate Speech (Prohibited)",
    FRAUD: "Fraudulent Use (Prohibited)",
    WEAPONS: "Weapons (Prohibited)",
    ILLEGAL: "Illegal Use (Prohibited)",
  };
  return scopes.map((s) => map[s] || s);
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId");
  if (!caseId) {
    return NextResponse.json({ success: false, error: "caseId is required" }, { status: 400 });
  }

  // Optional court info from lawyer
  const courtName = searchParams.get("courtName") || "United States District Court";
  const caseNumber = searchParams.get("caseNumber") || "";
  const plaintiffName = searchParams.get("plaintiffName") || "";
  const defendantName = searchParams.get("defendantName") || "";

  // Verify lawyer owns this case
  const lawyer = await prisma.lawyerRegistration.findFirst({
    where: { userId: session.userId, status: "APPROVED" },
    select: {
      id: true,
      userId: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      barNumber: true,
      barState: true,
    },
  });
  if (!lawyer) {
    return NextResponse.json({ success: false, error: "Not an approved lawyer" }, { status: 403 });
  }

  const lawyerCase = await prisma.lawyerCase.findFirst({
    where: { id: caseId, lawyerRegistrationId: lawyer.id },
    include: {
      infringementReport: {
        include: {
          reporter: { select: { id: true, displayName: true, email: true } },
          portrait: {
            select: {
              id: true,
              title: true,
              ownerId: true,
              certifiedAt: true,
              createdAt: true,
              updatedAt: true,
              certificateNumber: true,
              owner: { select: { id: true, displayName: true, email: true } },
            },
          },
          evidencePackages: {
            where: { evidenceType: { in: ["page_snapshot", "manual_entry"] } },
            select: {
              pageUrl: true,
              pageTitle: true,
              pageSnapshotUrl: true,
              contentHash: true,
              capturedAt: true,
            },
            orderBy: { capturedAt: "desc" },
          },
        },
      },
    },
  });

  if (!lawyerCase) {
    return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });
  }

  const report = lawyerCase.infringementReport;
  const portrait = report.portrait;
  const reporter = report.reporter;
  const owner = portrait.owner;

  // Consent record — PortraitSettings may not exist for all users
  let portraitSettings: { allowedScopes?: string[]; prohibitedScopes?: string[] } | null = null;
  try {
    portraitSettings = await prisma.portraitSettings.findFirst({
      where: { userId: portrait.ownerId },
      select: { allowedScopes: true, prohibitedScopes: true },
    });
  } catch { /* table may not exist yet */ }

  // Voice data fallback from InfringementReportQuick
  let quickReport: { id?: string; voiceSimilarityScore?: number; voiceSimilarityRisk?: string } | null = null;
  try {
    quickReport = await prisma.infringementReportQuick.findFirst({
      where: { id: report.id },
      select: { id: true, voiceSimilarityScore: true, voiceSimilarityRisk: true },
    });
  } catch { /* may not exist */ }

  // Face comparison technical report (P2) — from KYCLog
  let faceReport: EvidenceClaimData["faceReport"];
  try {
    const kycLog = await prisma.kYCLog.findFirst({
      where: { userId: portrait.ownerId, action: "CERTIFY" },
      orderBy: { createdAt: "desc" },
      select: { faceRawData: true },
    });
    if (kycLog?.faceRawData) {
      const raw = kycLog.faceRawData as Record<string, unknown>;
      if (raw.reportId && raw.methodology && raw.comparison && raw.expertConclusion) {
        faceReport = kycLog.faceRawData as unknown as EvidenceClaimData["faceReport"];
      }
    }
  } catch { /* KYCLog table may not be accessible */ }

  const exportDate = new Date();
  const caseRef = generateCaseRef(lawyerCase.id, lawyerCase.createdAt);
  const consentCreatedAt = portrait.certifiedAt || portrait.createdAt;

  // Build record hash from immutable fields
  const hashInput = [
    lawyerCase.id,
    report.id,
    reporter.id,
    portrait.id,
    report.type,
    report.description,
    report.createdAt.toISOString(),
    lawyerCase.status,
    String(lawyerCase.compensation || "0"),
  ].join("|");
  const recordHash = sha256(hashInput);

  // IPFS CID — from the infringement report
  const ipfsCid = report.reportIpfsCid || "";

  // Verification URL (publicly accessible)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portraitpayai.com";
  const verificationUrl = `${baseUrl}/verify?hash=${recordHash}`;

  const hasVoice = !!(report.voiceSimilarityScore != null || quickReport?.voiceSimilarityScore != null);
  const hasFace = !!(report.faceComparisonScore != null);

  const data: EvidenceClaimData = {
    caseId: lawyerCase.id,
    caseRef,
    exportDate: formatDate(exportDate),
    exportTimestamp: exportDate.toISOString(),
    status: lawyerCase.status,
    compensation: lawyerCase.compensation
      ? `$${Number(lawyerCase.compensation).toFixed(2)}`
      : "TBD",

    // Court info
    courtName,
    caseNumber,
    plaintiffName: plaintiffName || owner?.displayName || "",
    defendantName,

    // Claimant (reporter who filed the report)
    claimantName: reporter.displayName || reporter.email.split("@")[0],
    claimantEmail: reporter.email,
    claimantProfileUrl: `${baseUrl}/profile/${reporter.id}`,

    // Portrait owner (may differ from reporter)
    portraitOwnerName: owner?.displayName || reporter.displayName || "--",
    portraitOwnerEmail: owner?.email || reporter.email,

    // Consent
    consentPassportId: portrait.certificateNumber
      ? `PPC-${portrait.certificateNumber}`
      : `PP-CERT-${portrait.id.slice(0, 8).toUpperCase()}`,
    consentCreatedAt: formatDate(consentCreatedAt),
    consentModifiedAt: portrait.updatedAt !== consentCreatedAt ? formatDate(portrait.updatedAt) : "",

    // Portrait
    portraitTitle: portrait.title,
    portraitId: portrait.id,

    // Scopes
    allowedScopes: scopeLabels(portraitSettings?.allowedScopes || []),
    prohibitedScopes: scopeLabels(portraitSettings?.prohibitedScopes || []),

    // Infringement
    infringementType: report.type,
    infringementDescription: report.description,
    infringementDetectedAt: report.detectedAt ? formatDate(report.detectedAt) : "--",
    infringementPlatformUrl: report.detectedUrl || "--",
    infringementEvidence: report.evidenceUrls || [],
    evidenceScreenshots: (report.evidencePackages ?? [])
      .filter((ep) => ep.pageSnapshotUrl)
      .map((ep) => ({
        pageUrl: ep.pageUrl ?? "",
        pageTitle: ep.pageTitle ?? undefined,
        screenshotUrl: ep.pageSnapshotUrl ?? "",
        screenshotHash: ep.contentHash,
        capturedAt: formatDate(ep.capturedAt),
      })),
    infringementReportCreatedAt: formatDate(report.createdAt),
    infringementReportId: report.id,

    // Lawyer info
    lawyerFirm: lawyer?.companyName || "",
    lawyerName: lawyer?.contactName || "",
    lawyerEmail: lawyer?.contactEmail || "",
    lawyerPhone: lawyer?.contactPhone || "",
    lawyerBarNumber: lawyer?.barNumber || "",
    lawyerBarState: lawyer?.barState || "",

    // Biometric
    hasVoice,
    voiceRefId: report.voiceSimilarityScore != null ? report.id : (quickReport?.id || "--"),
    voiceSimilarityScore: report.voiceSimilarityScore ?? quickReport?.voiceSimilarityScore ?? 0,
    voiceRisk: report.voiceSimilarityRisk || quickReport?.voiceSimilarityRisk || "UNKNOWN",
    hasFace,
    faceComparisonScore: report.faceComparisonScore ?? 0,
    faceImageUrl: report.faceImageUrl || "",

    // Verification
    recordHash,
    ipfsCid,
    verificationUrl,

    // Face comparison technical report (P2)
    faceReport,
  };

  try {
    // Generate PDF
    const buffer = await renderToBuffer(EvidenceDocument({ data }));

    // Log export
    await prisma.evidenceExport.create({
      data: {
        caseId: lawyerCase.id,
        lawyerId: lawyer.userId,
        fileHash: recordHash,
      },
    });

    // Generate evidence manifest (machine-readable JSON)
    const manifest = {
      manifestVersion: "1.0",
      generatedAt: exportDate.toISOString(),
      platform: "PortraitPay AI",
      caseReference: caseRef,
      recordHash,
      ipfsCid: ipfsCid || null,
      verificationUrl,
      case: {
        id: lawyerCase.id,
        status: lawyerCase.status,
        compensation: Number(lawyerCase.compensation || 0),
      },
      parties: {
        plaintiff: {
          name: data.plaintiffName || data.portraitOwnerName,
          email: data.portraitOwnerEmail,
        },
        defendant: {
          name: defendantName || null,
        },
        counsel: {
          firm: data.lawyerFirm,
          name: data.lawyerName,
          email: data.lawyerEmail,
          phone: data.lawyerPhone,
        },
      },
      portrait: {
        id: portrait.id,
        title: portrait.title,
        consentPassportId: data.consentPassportId,
        allowedScopes: data.allowedScopes,
        prohibitedScopes: data.prohibitedScopes,
      },
      infringement: {
        type: report.type,
        description: report.description,
        detectedUrl: report.detectedUrl || null,
        evidenceUrls: report.evidenceUrls || [],
        reportId: report.id,
      },
      biometrics: {
        voice: hasVoice ? {
          similarityScore: data.voiceSimilarityScore,
          risk: data.voiceRisk,
          model: "ECAPA-TDNN (x-vector, 192-dim)",
          threshold: 0.80,
        } : null,
        face: hasFace ? {
          similarityScore: data.faceComparisonScore,
          imageUrl: data.faceImageUrl || null,
        } : null,
      },
      evidenceChain: (report.evidenceUrls || []).map((url, i) => ({
        exhibit: `Exhibit A-${i + 1}`,
        url,
        capturedAt: report.createdAt.toISOString(),
        hashAlgorithm: "SHA-256",
      })),
    };

    const dateStr = exportDate.toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `PortraitPay_Evidence_${caseRef}_${dateStr}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "X-Record-Hash": recordHash,
        "X-Verification-URL": verificationUrl,
        "X-IPFS-CID": ipfsCid || "",
        "X-Evidence-Manifest": JSON.stringify(manifest),
      },
    });
  } catch (err) {
    console.error("[EXPORT EVIDENCE ERROR]", err);
    return NextResponse.json({ success: false, error: "PDF generation failed" }, { status: 500 });
  }
}
