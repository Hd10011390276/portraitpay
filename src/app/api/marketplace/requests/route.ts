/**
 * GET /api/marketplace/requests — list requests
 * POST /api/marketplace/requests — create a request
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["LICENSING", "CREATOR_PROJECT", "LEGAL_HELP", "INFRINGEMENT"];
const VALID_SCOPES = [
  "FILM", "ANIMATION", "ADVERTISING", "GAMING", "PRINT",
  "MERCHANDISE", "SOCIAL_MEDIA", "EDUCATION", "NEWS",
];

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const mine = searchParams.get("mine");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (mine === "true") where.requesterId = session.userId;

  const requests = await prisma.marketplaceRequest.findMany({
    where,
    include: {
      requester: { select: { id: true, displayName: true } },
      portrait: { select: { id: true, title: true, thumbnailUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: requests });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    type = "LICENSING",
    targetUserId,
    portraitId,
    conversationId,
    title,
    description,
    budget,
    currency = "USD",
    usageScope = [],
    territory = "global",
    deadline,
  } = body;

  if (!title) {
    return NextResponse.json({ success: false, error: "title required" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
  }

  const req = await prisma.marketplaceRequest.create({
    data: {
      type,
      requesterId: session.userId,
      targetUserId: targetUserId ?? null,
      portraitId: portraitId ?? null,
      conversationId: conversationId ?? null,
      title,
      description: description ?? null,
      budget: budget ?? null,
      currency,
      usageScope,
      territory,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json({ success: true, data: req }, { status: 201 });
}