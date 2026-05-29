/**
 * GET /api/v1/agency/performance
 * POST /api/v1/agency/performance
 * List and create performance approval applications for the current agency
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = { agencyId: agency.id };
    if (status) {
      where.status = status;
    }

    const applications = await prisma.agencyPerformanceApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, applications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch applications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { eventName, eventDate, artistName, artistUserId, description, deadline } = body;

    if (!eventName || typeof eventName !== "string" || eventName.trim().length === 0) {
      return NextResponse.json({ success: false, error: "eventName is required" }, { status: 400 });
    }

    const application = await prisma.agencyPerformanceApplication.create({
      data: {
        agencyId: agency.id,
        eventName: eventName.trim(),
        eventDate: eventDate ? new Date(eventDate) : null,
        artistName: artistName?.trim() || null,
        artistUserId: artistUserId || null,
        description: description?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create application";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}