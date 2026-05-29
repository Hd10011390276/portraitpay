/**
 * POST /api/report/submit
 * Creates an infringement report for the authenticated user.
 * Sends an email notification to the reporter with the full report text.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/edge-jwt";
import { sendInfringementReportEmail } from "@/lib/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SubmitSchema = z.object({
  reporterName: z.string().min(1).max(100),
  reporterEmail: z.string().email(),
  reporterPhone: z.string().max(20).optional(),
  infringerName: z.string().min(1).max(100),
  infringerEmail: z.string().email(),
  infringementType: z.string(),
  platformName: z.string().max(50).optional(),
  platformUrl: z.string().url().max(500).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  evidenceUrls: z.array(z.string().url()).max(10).default([]),
  voiceSimilarityScore: z.number().min(0).max(1).optional().nullable(),
  voiceSimilarityRisk: z.string().optional().nullable(),
});

function makeReportNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 999999).toString().padStart(6, "0");
  return `PP-IR-${year}-${seq}`;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken =
    req.cookies.get("pp_access_token")?.value || req.cookies.get("accessToken")?.value;
  const token = bearerToken || cookieToken;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const jwtPayload = await verifyToken(token!);
  const userId = jwtPayload?.userId;
  if (!userId) {
    return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // XSS sanitization — reject dangerous patterns in all string fields
    const dangerousPattern = /<script|<\/script|<iframe|onerror\s*=|onload\s*=|javascript:/i;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string" && dangerousPattern.test(value)) {
        return NextResponse.json(
          { success: false, error: "Invalid input: unsafe content detected" },
          { status: 400 }
        );
      }
    }

    const reportNumber = makeReportNumber();

    const record = await prisma.infringementReportQuick.create({
      data: {
        id: crypto.randomUUID(),
        reportNumber,
        status: "GENERATED",
        userId,
        reportedName: data.infringerName,
        reportedEmail: data.infringerEmail,
        phone: data.reporterPhone || null,
        infringementType: data.infringementType,
        platformUrl: data.platformUrl || null,
        platformName: data.platformName || null,
        description: data.description || null,
        evidenceUrls: data.evidenceUrls,
        generatedAt: new Date(),
        voiceSimilarityScore: data.voiceSimilarityScore ?? null,
        voiceSimilarityRisk: data.voiceSimilarityRisk ?? null,
        voiceComparedAt: data.voiceSimilarityScore != null ? new Date() : null,
      },
    });

    // Record manual evidence entries (cold-start — no screenshot dependency)
    try {
      const { recordManualEvidence } = await import("@/lib/infringement/evidence");
      for (const url of data.evidenceUrls) {
        await recordManualEvidence({
          evidenceUrl: url,
          evidenceDescription: data.description || `Evidence URL submitted via report ${reportNumber}`,
          capturedBy: userId,
        });
      }
      if (data.description && data.description.length > 0) {
        await recordManualEvidence({
          evidenceDescription: data.description,
          capturedBy: userId,
        });
      }
    } catch (err) {
      console.error("[report/submit] Manual evidence recording failed:", err);
      // Non-blocking
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const reportUrl = `${baseUrl}/report/${reportNumber}`;

    await sendInfringementReportEmail({
      name: data.reporterName,
      email: data.reporterEmail,
      reportNumber: record.reportNumber,
      infringerName: data.infringerName,
      infringerEmail: data.infringerEmail,
      infringementType: data.infringementType,
      platformName: data.platformName || null,
      platformUrl: data.platformUrl || null,
      description: data.description || null,
      evidenceUrls: data.evidenceUrls,
      reportUrl,
      generatedAt: record.generatedAt,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        reportNumber: record.reportNumber,
        status: record.status,
        reportUrl,
        generatedAt: record.generatedAt,
      },
    });
  } catch (err) {
    console.error("[report/submit]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}