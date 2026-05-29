/**
 * GET    /api/infringements/[id]  — Get infringement report detail
 * PATCH  /api/infringements/[id]  — Update report (reporter or admin)
 * DELETE /api/infringements/[id]  — Soft-delete (reporter can withdraw pending reports)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";


const UpdateInfringementSchema = z.object({
  description: z.string().min(10).optional(),
  evidenceUrls: z.array(z.string().url()).min(1).optional(),
  detectedUrl: z.string().url().optional().or(z.literal("")),
});

// ─────────────────────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ id: string }> };

async function getReport(id: string, userId: string, role: string) {
  const report = await prisma.infringementReport.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, displayName: true, email: true } },
      defendant: { select: { id: true, displayName: true, email: true } },
      portrait: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          thumbnailUrl: true,
          originalImageUrl: true,
          imageHash: true,
        },
      },
      notices: {
        orderBy: { createdAt: "desc" },
      },
      evidencePackages: {
        orderBy: { capturedAt: "desc" },
        select: {
          id: true,
          evidenceType: true,
          pageSnapshotUrl: true,
          contentHash: true,
          pageUrl: true,
          pageTitle: true,
          capturedAt: true,
        },
      },
    },
  });

  if (!report) return null;

  const isOwner = report.reporterId === userId;
  const isAdmin = role === "ADMIN" || role === "VERIFIER";
  const isPortraitOwner = report.portrait.ownerId === userId;

  if (!isOwner && !isAdmin && !isPortraitOwner) return null;

  return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const report = await getReport(id, session.userId, session.role ?? "");

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("[GET /api/infringements/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update report (only if still PENDING_REVIEW)
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.infringementReport.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const isReporter = existing.reporterId === session.userId;
    const isAdmin = session.role === "ADMIN" || session.role === "VERIFIER";

    // Only reporter (while pending) or admin can update
    if (!isReporter && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (isReporter && existing.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { success: false, error: "Cannot update a report that is no longer pending review" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = UpdateInfringementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.infringementReport.update({
      where: { id },
      data: {
        ...(parsed.data.description && { description: parsed.data.description }),
        ...(parsed.data.evidenceUrls && { evidenceUrls: parsed.data.evidenceUrls }),
        ...(parsed.data.detectedUrl !== undefined && { detectedUrl: parsed.data.detectedUrl || null }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/infringements/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Soft-delete (only reporter, only PENDING_REVIEW)
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.infringementReport.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (existing.reporterId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (existing.status !== "PENDING_REVIEW") {
      return NextResponse.json({ success: false, error: "Can only delete pending reports" }, { status: 400 });
    }

    // Soft-delete: set deletedAt
    await prisma.infringementReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Report withdrawn" });
  } catch (error) {
    console.error("[DELETE /api/infringements/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
