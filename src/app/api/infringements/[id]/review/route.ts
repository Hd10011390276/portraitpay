/**
 * POST   /api/infringements/[id]/review  — Admin/Verifier reviews a report
 * Body: { decision: "VALIDATED" | "REJECTED" | "SETTLED" | "LEGAL_ACTION", resolution?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";

const ReviewSchema = z.object({
  decision: z.enum(["VALIDATED", "REJECTED", "SETTLED", "LEGAL_ACTION"]),
  resolution: z.string().optional(),
  defendantId: z.string().optional(), // Admin may link a user account as defendant
});

// ─────────────────────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role ?? "";
    if (role !== "ADMIN" && role !== "VERIFIER") {
      return NextResponse.json({ success: false, error: "Forbidden — verifier or admin required" }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.infringementReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (existing.status !== "PENDING_REVIEW") {
      return NextResponse.json({ success: false, error: "Report already reviewed" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid decision", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { decision, resolution, defendantId } = parsed.data;

    const updated = await prisma.infringementReport.update({
      where: { id },
      data: {
        status: decision,
        verifierId: session.user.id,
        verifiedAt: new Date(),
        resolution: resolution || null,
        ...(defendantId && { defendantId }),
      },
      include: {
        reporter: { select: { id: true, email: true, displayName: true } },
        portrait: { select: { id: true, title: true, ownerId: true } },
      },
    });

    // If validated, suspend the portrait as a precaution
    if (decision === "VALIDATED") {
      await prisma.portrait.update({
        where: { id: existing.portraitId },
        data: { status: "SUSPENDED" },
      });
    }

    console.log(`[Review] Report ${id} ${decision} by ${session.user.id}. Resolution: ${resolution ?? "N/A"}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[POST /api/infringements/[id]/review]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
