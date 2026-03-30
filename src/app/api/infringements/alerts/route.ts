/**
 * Infringement Alert API
 *
 * POST /api/infringements/alerts/confirm  — Owner confirms/rejects a system alert
 * GET  /api/infringements/alerts         — List alerts for the authenticated owner
 * GET  /api/infringements/alerts/[id]    — Get alert detail
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// POST — Owner decision on an alert
// Body: { alertId: string, decision: "CONFIRMED" | "FALSE_POSITIVE" }
// ─────────────────────────────────────────────────────────────────────────────

const AlertDecisionSchema = z.object({
  alertId: z.string().min(1),
  decision: z.enum(["CONFIRMED", "FALSE_POSITIVE"]),
});

// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { ownerId: session.user.id };
    if (status) where.status = status;

    const [alerts, total] = await Promise.all([
      prisma.infringementAlert.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.infringementAlert.count({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: alerts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/infringements/alerts]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AlertDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { alertId, decision } = parsed.data;

    const alert = await prisma.infringementAlert.findUnique({ where: { id: alertId } });
    if (!alert) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 });
    }

    if (alert.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Update alert status
    await prisma.infringementAlert.update({
      where: { id: alertId },
      data: {
        status: decision === "CONFIRMED" ? "CONFIRMED" : "FALSE_POSITIVE",
        ownerConfirmedAt: new Date(),
        ownerDecision: decision,
      },
    });

    // If confirmed → create an InfringementReport
    if (decision === "CONFIRMED") {
      const report = await prisma.infringementReport.create({
        data: {
          reporterId: alert.ownerId!,
          portraitId: alert.portraitId,
          type: "UNAUTHORIZED_USE",
          description: `Automatically created from system monitoring alert. Platform: ${alert.sourceName}. Similarity: ${(alert.similarityScore * 100).toFixed(1)}%`,
          detectedUrl: alert.sourceUrl,
          detectedAt: alert.createdAt,
          evidenceUrls: alert.screenshotUrl ? [alert.screenshotUrl] : [],
          evidenceHash: alert.screenshotHash ?? `alert-${alert.id}`,
          status: "PENDING_REVIEW",
          source: "AUTO",
          similarityScore: alert.similarityScore,
          alertId: alert.id,
        },
      });

      // Link alert to report
      await prisma.infringementAlert.update({
        where: { id: alertId },
        data: { reportId: report.id },
      });

      return NextResponse.json({
        success: true,
        data: { alertId, reportId: report.id },
        message: "Alert confirmed and infringement report created",
      });
    }

    return NextResponse.json({ success: true, message: `Alert marked as ${decision === "FALSE_POSITIVE" ? "false positive" : "confirmed"}` });
  } catch (error) {
    console.error("[POST /api/infringements/alerts]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
