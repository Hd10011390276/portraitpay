/**
 * GET /api/conversations/[id] — Get conversation details (used by inbox thread page)
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session.userId } },
  });
  if (!participant) {
    return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        include: { user: { select: { id: true, displayName: true, email: true, image: true } } },
      },
      portrait: { select: { id: true, title: true, thumbnailUrl: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: conversation,
    currentUserId: session.userId,
  });
}