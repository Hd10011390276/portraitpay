/**
 * GET /api/marketplace/offers — list offers for current user
 * POST /api/marketplace/offers — create an offer
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { createOffer } from "@/lib/marketplace/offers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const direction = searchParams.get("direction"); // "sent" | "received" | undefined (all)

  const where: Record<string, unknown> = {};
  if (direction === "sent") where.fromUserId = session.userId;
  else if (direction === "received") where.toUserId = session.userId;
  else where.OR = [{ fromUserId: session.userId }, { toUserId: session.userId }];
  if (status) where.status = status;

  const offers = await prisma.offer.findMany({
    where,
    include: {
      fromUser: { select: { id: true, displayName: true } },
      toUser: { select: { id: true, displayName: true } },
      request: { select: { id: true, title: true } },
      conversation: { select: { id: true, subject: true } },
      licensePackage: { select: { id: true, title: true, price: true } },
      deal: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: offers });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    toUserId,
    type = "LICENSE",
    title,
    terms,
    amount,
    currency = "USD",
    requestId,
    conversationId,
    licensePackageId,
    expiresAt,
  } = body;

  if (!toUserId) {
    return NextResponse.json({ success: false, error: "toUserId required" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ success: false, error: "title required" }, { status: 400 });
  }
  if (!terms) {
    return NextResponse.json({ success: false, error: "terms required" }, { status: 400 });
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ success: false, error: "amount must be positive" }, { status: 400 });
  }

  const VALID_TYPES = ["LICENSE", "LEGAL_SERVICE", "CREATOR_SERVICE"];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
  }

  try {
    const offer = await createOffer({
      fromUserId: session.userId,
      toUserId,
      type,
      title,
      terms,
      amount,
      currency,
      requestId,
      conversationId,
      licensePackageId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    return NextResponse.json({ success: true, data: offer }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to create offer" },
      { status: 400 }
    );
  }
}