/**
 * GET /api/conversations — List user's conversations
 * POST /api/conversations — Create a new conversation
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — list conversations for current user
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    participants: { some: { userId: session.userId } },
  };
  if (status) where.status = status;

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      participants: {
        include: { user: { select: { id: true, displayName: true, email: true, image: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, senderId: true, createdAt: true },
      },
      portrait: { select: { id: true, title: true, thumbnailUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: conversations });
}

// POST — create a new conversation
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { type, subject, participantIds, portraitId, authorizationId, infringementReportId, lawyerCaseId } = body;

  if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
    return NextResponse.json({ success: false, error: "At least one participant is required" }, { status: 400 });
  }

  // Include current user as a participant
  const allParticipants = Array.from(new Set([session.userId, ...participantIds]));

  // Check for duplicate open conversation with same participants + portraitId
  if (portraitId) {
    const existing = await prisma.conversation.findFirst({
      where: {
        status: "OPEN",
        portraitId,
        AND: [
          { participants: { some: { userId: session.userId } } },
          ...allParticipants.map((uid) => ({ participants: { some: { userId: uid } } })),
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, duplicate: true });
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: type || "GENERAL",
      subject: subject || null,
      portraitId: portraitId || null,
      authorizationId: authorizationId || null,
      infringementReportId: infringementReportId || null,
      lawyerCaseId: lawyerCaseId || null,
      status: "OPEN",
      participants: {
        create: allParticipants.map((uid) => ({
          userId: uid,
          roleInConversation: uid === session.userId ? "CREATOR" : "ACTOR",
        })),
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, displayName: true } } } },
      portrait: { select: { id: true, title: true, thumbnailUrl: true } },
    },
  });

  return NextResponse.json({ success: true, data: conversation }, { status: 201 });
}