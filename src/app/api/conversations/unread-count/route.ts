/**
 * GET /api/conversations/unread-count — Get unread conversation count for current user
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.userId;

  // Count conversations where lastReadAt < latest message createdAt
  const result = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  let count = 0;
  for (const participant of result) {
    const latestMessage = participant.conversation.messages[0];
    if (latestMessage) {
      const lastReadAt = participant.lastReadAt ?? new Date(0);
      if (lastReadAt < latestMessage.createdAt) {
        count++;
      }
    }
  }

  return NextResponse.json({ count }, { status: 200 });
}