/**
 * GET /api/conversations/[id] — Get conversation details + messages
 * POST /api/conversations/[id]/messages — Send a message in conversation
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET — get conversation + paginated messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

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

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id, deletedAt: null },
      include: { sender: { select: { id: true, displayName: true, image: true } } },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId: id, deletedAt: null } }),
  ]);

  // Mark as read for current user
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId: session.userId },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    data: {
      conversation,
      messages,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
}

// POST — send a message in conversation
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  // Check conversation is open
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
  }
  if (conversation.status !== "OPEN") {
    return NextResponse.json({ success: false, error: "Conversation is closed" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { subject, message, attachments } = body;

  if (!message || !message.trim()) {
    return NextResponse.json({ success: false, error: "Message body is required" }, { status: 400 });
  }

  // Determine sender type/role from session
  const senderType = session.role === "LAWYER" ? "LAWYER" : session.role === "ADMIN" ? "ADMIN" : "USER";
  const senderRole = session.role === "ACTOR" || session.role === "TALENT" ? "ACTOR"
    : session.role === "CREATOR" ? "CREATOR"
    : session.role === "ADMIN" ? "ADMIN"
    : "VERIFIER";

  const newMessage = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: session.userId,
      senderType,
      senderRole,
      subject: subject || null,
      body: message.trim(),
      attachments: attachments || null,
    },
    include: { sender: { select: { id: true, displayName: true, image: true } } },
  });

  // Update conversation updatedAt
  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  // Update lastReadAt for sender
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId: session.userId },
    data: { lastReadAt: new Date() },
  });

  // Send email notification to other participants
  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId: id, userId: { not: session.userId } },
    include: { user: { select: { id: true, displayName: true, email: true } } },
  });

  const senderDisplayName = session.displayName || session.name || "Someone";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await Promise.all(otherParticipants.map(async (participant) => {
    if (!participant.user.email) return;
    try {
      await sendEmail({
        to: participant.user.email,
        subject: `💬 New message from ${senderDisplayName}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)"><div style="background:#7c3aed;padding:20px 24px"><h2 style="margin:0;color:#fff;font-size:18px">💬 New Message on PortraitPay AI</h2><p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">You have a new message</p></div><div style="padding:24px"><p style="font-size:15px;color:#333">Hi ${participant.user.displayName || "there"},</p><p style="font-size:15px;color:#333"><strong>${senderDisplayName}</strong> sent you a message${conversation.subject ? ` about "${conversation.subject}"` : ""}:</p><div style="margin:16px 0;padding:16px;background:#f9f9f9;border-radius:8px;border-left:4px solid #7c3aed"><p style="margin:0;font-size:14px;color:#333;white-space:pre-wrap">${message.trim().slice(0, 200)}${message.trim().length > 200 ? "..." : ""}</p></div><div style="text-align:center;margin:20px 0"><a href="${appUrl}/inbox/${id}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">View Message →</a></div><p style="font-size:12px;color:#999;margin-top:16px">You received this because you have an active conversation on PortraitPay AI.</p></div></div></body></html>`,
        text: `PortraitPay AI — New message from ${senderDisplayName}\n\n${message.trim()}\n\nView message: ${appUrl}/inbox/${id}`,
      });
    } catch (e) {
      console.error("[Message email] failed:", e instanceof Error ? e.message : String(e));
    }
  }));

  return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
}