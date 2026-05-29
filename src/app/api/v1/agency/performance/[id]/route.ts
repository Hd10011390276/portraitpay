/**
 * PATCH /api/v1/agency/performance/[id]
 * Update a performance application (status change, edit details)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agency = await prisma.agencyAccount.findUnique({
      where: { userId: session.userId },
    });

    if (!agency) {
      return NextResponse.json({ success: false, error: "Agency not found" }, { status: 404 });
    }

    const { id } = params;

    const existing = await prisma.agencyPerformanceApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    if (existing.agencyId !== agency.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { status, eventName, eventDate, artistName, artistUserId, description, deadline, reviewNotes } = body;

    // Validate status transitions
    const validStatuses = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    // Validate reviewNotes is provided when rejecting
    if (status === "REJECTED" && !reviewNotes && existing.status !== "REJECTED") {
      return NextResponse.json({ success: false, error: "reviewNotes required for rejection" }, { status: 400 });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      // Auto-set reviewer when status changes to non-draft
      if (status === "UNDER_REVIEW" || status === "APPROVED" || status === "REJECTED") {
        updateData.reviewerId = session.userId;
        updateData.reviewedAt = new Date();
        if (reviewNotes) updateData.reviewNotes = reviewNotes;
      }
    }

    if (eventName !== undefined) updateData.eventName = eventName.trim();
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : null;
    if (artistName !== undefined) updateData.artistName = artistName?.trim() || null;
    if (artistUserId !== undefined) updateData.artistUserId = artistUserId || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes?.trim() || null;

    const updated = await prisma.agencyPerformanceApplication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update application";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}