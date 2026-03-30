/**
 * GET    /api/infringements  — List infringement reports (filtered)
 * POST   /api/infringements  — Submit a manual infringement report
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { buildEvidenceSetHash } from "@/lib/infringement/evidence";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

const CreateInfringementSchema = z.object({
  portraitId: z.string().min(1, "portraitId is required"),
  type: z.enum([
    "UNAUTHORIZED_USE",
    "EXPIRED_LICENSE",
    "SCOPE_VIOLATION",
    "RESALE",
    "DEEPFAKE",
  ]),
  description: z.string().min(10, "Please provide a detailed description (at least 10 characters)"),
  detectedUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
  // Multiple evidence URLs (screenshots)
  evidenceUrls: z.array(z.string().url()).min(1, "At least one evidence URL is required").max(10),
  originalImageUrl: z.string().url().optional().or(z.literal("")),
});

const ListInfringementSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  type: z.string().optional(),
  portraitId: z.string().optional(),
  source: z.string().optional(), // "AUTO" | "MANUAL"
});

// ─────────────────────────────────────────────────────────────────────────────
// GET — List infringement reports
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = ListInfringementSchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query params", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, status, type, portraitId, source } = parsed.data;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "VERIFIER";

    // Non-admins can only see their own reports
    const where: Record<string, unknown> = {};
    if (!isAdmin) {
      where.reporterId = session.user.id;
    }
    if (status) where.status = status;
    if (type) where.type = type;
    if (portraitId) where.portraitId = portraitId;
    if (source) where.source = source;

    const [reports, total] = await Promise.all([
      prisma.infringementReport.findMany({
        where,
        include: {
          reporter: { select: { id: true, displayName: true, email: true } },
          defendant: { select: { id: true, displayName: true } },
          portrait: {
            select: { id: true, title: true, thumbnailUrl: true, ownerId: true },
          },
          notices: {
            select: { id: true, type: true, status: true, sentAt: true },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          _count: { select: { notices: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.infringementReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/infringements]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Submit a manual infringement report
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateInfringementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { portraitId, type, description, detectedUrl, evidenceUrls, originalImageUrl } = parsed.data;

    // Verify the portrait exists and is active
    const portrait = await prisma.portrait.findUnique({
      where: { id: portraitId, deletedAt: null },
    });
    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    // Compute evidence hash
    const evidenceHash = buildEvidenceSetHash(
      evidenceUrls.map((url, i) => ({
        contentHash: `sha256:${Buffer.from(url).toString("base64").slice(0, 16)}`, // STUB — replace with real hash
        capturedAt: new Date(),
        evidenceUrl: url,
      }))
    );

    // Create the report
    const report = await prisma.infringementReport.create({
      data: {
        reporterId: session.user.id,
        portraitId,
        type,
        description,
        detectedUrl: detectedUrl || null,
        detectedAt: new Date(),
        evidenceUrls,
        evidenceHash,
        originalImageUrl: originalImageUrl || null,
        status: "PENDING_REVIEW",
        source: "MANUAL",
      },
      include: {
        portrait: { select: { id: true, title: true, ownerId: true } },
      },
    });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/infringements]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
