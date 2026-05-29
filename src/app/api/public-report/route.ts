/**
 * POST /api/public-report — Public infringement report submission
 *
 * No authentication required.
 * Supports webhook extensibility via PUBLIC_REPORT_WEBHOOK_URL env var.
 * Rate limiting: 5 submissions per IP per hour.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

const PublicReportSchema = z.object({
  portraitId:    z.string().optional(),
  portraitTitle: z.string().optional(),
  reporterEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  reporterName:  z.string().max(100).optional().or(z.literal("")),
  type: z.enum([
    "UNAUTHORIZED_USE",
    "EXPIRED_LICENSE",
    "SCOPE_VIOLATION",
    "RESALE",
    "DEEPFAKE",
  ]),
  description:    z.string().min(10, "Please describe in at least 10 characters"),
  detectedUrl:    z.string().url().optional().or(z.literal("")),
  evidenceUrls:   z.array(z.string().url()).min(1, "At least one evidence URL is required").max(10),
  originalImageUrl: z.string().url().optional().or(z.literal("")),
  // Extensibility hooks
  metadata:       z.record(z.string(), z.unknown()).optional(),
  // Internal: skip webhook (for testing)
  _skipWebhook:   z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — Submit a public infringement report
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate limiting — simple in-memory per IP (production: use Redis)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            ?? request.headers.get("x-real-ip") ?? "unknown";

    const rateLimitKey = `public-report:${ip}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxPerWindow = 5;

    // Use a module-level Map for simple rate limiting (resets on cold start)
    // In production, replace with Redis or Upstash
    const rateLimitStore = (globalThis as Record<string, unknown>).__rateLimitStore as Map<string, { count: number; resetAt: number }> | undefined;
    const store: Map<string, { count: number; resetAt: number }> = rateLimitStore ?? new Map();
    if (!rateLimitStore) {
      (globalThis as Record<string, unknown>).__rateLimitStore = store;
    }

    const entry = store.get(rateLimitKey);
    if (entry && entry.resetAt > now) {
      if (entry.count >= maxPerWindow) {
        return NextResponse.json(
          { success: false, error: "Too many submissions. Please try again later.", retryAfter: Math.ceil((entry.resetAt - now) / 1000) },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      store.set(rateLimitKey, { count: 1, resetAt: now + windowMs });
    }

    const body = await request.json();
    const parsed = PublicReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      portraitId, portraitTitle, reporterEmail, reporterName,
      type, description, detectedUrl, evidenceUrls, originalImageUrl,
      metadata, _skipWebhook,
    } = parsed.data;

    // Deduplication hash
    const reportHash = createHash("sha256")
      .update(JSON.stringify({ portraitId, type, description, detectedUrl, evidenceUrls }))
      .digest("hex");

    // Check duplicate
    const existing = await prisma.publicReport.findUnique({ where: { reportHash } });
    if (existing) {
      return NextResponse.json(
        { success: true, data: { id: existing.id, status: existing.status, duplicate: true }, message: "Report already submitted" },
        { status: 200 }
      );
    }

    // Merge metadata
    const enrichedMetadata = {
      ...metadata,
      ip,
      userAgent: request.headers.get("user-agent") ?? null,
      submittedAt: new Date().toISOString(),
      source: "public-form",
    };

    // Create the report
    const report = await prisma.publicReport.create({
      data: {
        portraitId:         portraitId || null,
        portraitTitle:      portraitTitle || null,
        reporterEmail:      reporterEmail || null,
        reporterName:       reporterName || null,
        type,
        description,
        detectedUrl:        detectedUrl || null,
        evidenceUrls,
        originalImageUrl:   originalImageUrl || null,
        status:             "PENDING_REVIEW",
        reportHash,
        metadata:           enrichedMetadata as object,
        webhookLog:         undefined,
      },
    });

    // ── Webhook extensibility ──────────────────────────────────────────────
    // If PUBLIC_REPORT_WEBHOOK_URL is set, fire-and-forget the webhook.
    // Retries up to 3 times on failure. Result is stored in webhookLog.
    if (!_skipWebhook) {
      const webhookUrl = process.env.PUBLIC_REPORT_WEBHOOK_URL;
      if (webhookUrl) {
        fireWebhook(webhookUrl, {
          id:           report.id,
          portraitId:   report.portraitId,
          type:         report.type,
          description:  report.description,
          detectedUrl:  report.detectedUrl,
          evidenceUrls: report.evidenceUrls,
          reporterEmail: report.reporterEmail,
          reporterName:  report.reporterName,
          metadata:     report.metadata as object | null,
        }, store, rateLimitKey).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id:         report.id,
        status:     report.status,
        createdAt:  report.createdAt,
      },
      message: "Report submitted successfully. Our team will review it shortly.",
    }, { status: 201 });

  } catch (error) {
    console.error("[POST /api/public-report]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — List public reports (admin only via header secret)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const adminSecret = request.headers.get("x-admin-secret");
  if (adminSecret !== process.env.INFRINGEMENT_ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const status = searchParams.get("status") ?? undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [reports, total] = await Promise.all([
    prisma.publicReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.publicReport.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: reports,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook helper — fires async, updates webhookLog on completion
// ─────────────────────────────────────────────────────────────────────────────

async function fireWebhook(
  url: string,
  report: { id: string; portraitId?: string | null; type: string; description: string; detectedUrl?: string | null; evidenceUrls: string[]; reporterEmail?: string | null; reporterName?: string | null; metadata?: object | null },
  _store: Map<string, { count: number; resetAt: number }>,
  _rateLimitKey: string
) {
  const maxRetries = 3;
  const payload = {
    event: "public_report.submitted",
    report: {
      id:             report.id,
      portraitId:     report.portraitId,
      type:           report.type,
      description:    report.description,
      detectedUrl:    report.detectedUrl,
      evidenceUrls:   report.evidenceUrls,
      reporterEmail:  report.reporterEmail,
      reporterName:   report.reporterName,
      metadata:       report.metadata,
      submittedAt:    new Date().toISOString(),
    },
  };

  let lastError: string | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-Webhook-Source": "portraitpay-public-report" },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(8000),
      });

      if (res.ok) {
        await prisma.publicReport.update({
          where: { id: report.id },
          data:  { webhookLog: { attemptedAt: new Date().toISOString(), status: "delivered", attempt, responseStatus: res.status } as object },
        });
        return;
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, attempt * 1000)); // exponential backoff
    }
  }

  // All retries failed
  await prisma.publicReport.update({
    where: { id: report.id },
    data:  { webhookLog: { attemptedAt: new Date().toISOString(), status: "failed", error: lastError } as object },
  }).catch(console.error);
}
