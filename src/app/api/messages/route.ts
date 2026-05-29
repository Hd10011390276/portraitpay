import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, subject, content } = body;

  if (!conversationId || typeof conversationId !== "string") {
    return NextResponse.json({ success: false, error: "conversationId is required" }, { status: 400 });
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ success: false, error: "content is required" }, { status: 400 });
  }

  // Verify the user is a participant in this conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });

  if (!conversation) {
    return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
  }

  const isParticipant = conversation.participants.some((p) => p.userId === session.userId);
  if (!isParticipant) {
    return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.userId,
      senderType: session.role === "LAWYER" ? "LAWYER" : "USER",
      senderRole: session.role,
      conversationId,
      subject: subject || null,
      body: content.trim(),
    },
  });

  // Update conversation updatedAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ success: true, data: message }, { status: 201 });
}