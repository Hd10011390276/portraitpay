import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { z } from "zod";
import { notarizeInfringementEvidence } from "@/lib/infringement/notarization";
import { buildEvidenceSetHash } from "@/lib/infringement/evidence";

export const dynamic = "force-dynamic";

const CreateLawyerCaseSchema = z.object({
  portraitId: z.string().optional(),
  portraitTitle: z.string().min(1),
  type: z.enum(["UNAUTHORIZED_USE", "DEEPFAKE", "EXPIRED_LICENSE", "SCOPE_VIOLATION", "RESALE"]),
  description: z.string().min(20),
  detectedUrl: z.string().url().optional().or(z.literal("")),
  evidenceUrls: z.array(z.string().url()).min(1),
  originalImageUrl: z.string().url().optional().or(z.literal("")),
  reporterName: z.string().optional(),
  reporterEmail: z.string().email().optional(),
  compensation: z.number().min(0).optional(),
  voiceSimilarityScore: z.number().min(0).max(1).optional(),
  voiceSimilarityRisk: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).optional(),
  faceComparisonScore: z.number().min(0).max(1).optional(),
  faceImageUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.role !== "LAWYER") return NextResponse.json({ success: false, error: "Lawyers only" }, { status: 403 });

  const reg = await prisma.lawyerRegistration.findFirst({ where: { userId: session.userId, status: "APPROVED" } });
  if (!reg) return NextResponse.json({ success: false, error: "No approved lawyer registration" }, { status: 403 });

  const cases = await prisma.lawyerCase.findMany({
    where: { lawyerRegistrationId: reg.id },
    include: {
      infringementReport: {
        include: {
          reporter: { select: { displayName: true, email: true } },
          portrait: { select: { id: true, title: true, thumbnailUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: cases });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.role !== "LAWYER") return NextResponse.json({ success: false, error: "Lawyers only" }, { status: 403 });

  const reg = await prisma.lawyerRegistration.findFirst({ where: { userId: session.userId, status: "APPROVED" } });
  if (!reg) return NextResponse.json({ success: false, error: "No approved lawyer registration" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateLawyerCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { portraitId: rawPortraitId, portraitTitle, type, description, detectedUrl, evidenceUrls, originalImageUrl, reporterName, reporterEmail, compensation, voiceSimilarityScore, voiceSimilarityRisk, faceComparisonScore, faceImageUrl } = parsed.data;

    // Resolve portraitId — verify it exists, fallback if not
  let portraitId = rawPortraitId;
  if (rawPortraitId && !rawPortraitId.startsWith("self-reported-")) {
    const exists = await prisma.portrait.findUnique({ where: { id: rawPortraitId }, select: { id: true } });
    if (!exists) portraitId = undefined;
  }
  if (!portraitId || portraitId.startsWith("self-reported-")) {
    let portrait = await prisma.portrait.findFirst({
      where: { title: portraitTitle, ownerId: session.userId },
    });
    if (!portrait) {
      portrait = await prisma.portrait.create({
        data: {
          ownerId: session.userId,
          title: portraitTitle || "Self-Reported Portrait",
          status: "ACTIVE",
        },
      });
    }
    portraitId = portrait.id;
  }

  // Compute evidence hash
  const { createHash } = await import("crypto");
  const evidenceHash = buildEvidenceSetHash(
    evidenceUrls.map((url) => ({
      contentHash: createHash("sha256").update(url).digest("hex"),
      capturedAt: new Date(),
      evidenceUrl: url,
    }))
  );

  // Notarize to IPFS
  let reportHash: string | undefined;
  let reportIpfsCid: string | undefined;
  try {
    const result = await notarizeInfringementEvidence({
      reportId: "pending",
      portraitId,
      reporterId: session.userId,
      type,
      description,
      evidenceUrls,
      detectedUrl: detectedUrl || undefined,
    });
    reportHash = result.reportHash;
    reportIpfsCid = result.reportIpfsCid;
  } catch (err) {
    console.warn("[POST /api/lawyer/cases] IPFS notarization failed:", err);
  }

  const { VITE_PLATFORM_FEE_RATE = "0.10", VITE_LAWYER_FEE_RATE = "0.20" } = process.env;
  const platformRate = parseFloat(VITE_PLATFORM_FEE_RATE);
  const lawyerRate = parseFloat(VITE_LAWYER_FEE_RATE);
  const comp = compensation ?? 0;
  const platformFee = Math.round(comp * platformRate * 100) / 100;
  const lawyerFee = Math.round((comp - platformFee) * lawyerRate * 100) / 100;
  const portraitOwnerPayout = Math.round((comp - platformFee - lawyerFee) * 100) / 100;

  // Create InfringementReport first
  const report = await prisma.infringementReport.create({
    data: {
      portraitId,
      type,
      description,
      detectedUrl: detectedUrl || null,
      detectedAt: new Date(),
      evidenceUrls,
      evidenceHash,
      originalImageUrl: originalImageUrl || null,
      status: "VALIDATED",
      source: "LAWYER_SELF_REPORTED",
      reporterId: session.userId,
      reportHash: reportHash || null,
      reportIpfsCid: reportIpfsCid || null,
      verifiedAt: new Date(),
      voiceSimilarityScore: voiceSimilarityScore || null,
      voiceSimilarityRisk: voiceSimilarityRisk || null,
      faceComparisonScore: faceComparisonScore || null,
      faceImageUrl: faceImageUrl || null,
    },
  });

  // Create LawyerCase
  const lawyerCase = await prisma.lawyerCase.create({
    data: {
      infringementReportId: report.id,
      lawyerRegistrationId: reg.id,
      status: "IN_PROGRESS",
      platformConfirmed: true,
      compensation: comp,
      platformFee,
      lawyerFee,
      portraitOwnerPayout,
      lawyerFeeRate: lawyerRate,
      platformFeeRate: platformRate,
    },
  });

  // Create Conversation
  const conversation = await prisma.conversation.create({
    data: {
      type: "LAWYER_CASE",
      subject: `Case: ${type}`,
      status: "OPEN",
      infringementReportId: report.id,
      lawyerCaseId: lawyerCase.id,
      participants: {
        create: [{ userId: session.userId }],
      },
    },
  });

    return NextResponse.json({
      success: true,
      data: { caseId: lawyerCase.id, reportId: report.id, conversationId: conversation.id },
    }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/lawyer/cases] Error:", err?.message, err?.code, err?.meta);
    return NextResponse.json({
      success: false,
      error: err?.message || "Internal server error",
      code: err?.code || "UNKNOWN",
    }, { status: 500 });
  }
}