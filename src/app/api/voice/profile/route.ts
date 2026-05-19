/**
 * GET /api/voice/profile
 * Get current user's voice embedding info.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.voiceEmbedding.findUnique({
    where: { userId: session.userId },
    select: { id: true, duration: true, sampleUrl: true, createdAt: true, embedding: true },
  });

  if (!record) {
    return NextResponse.json({
      success: true,
      data: { hasEmbedding: false, registered: false },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      hasEmbedding: record.embedding.length > 0,
      registered: true,
      id: record.id,
      duration: record.duration,
      sampleUrl: record.sampleUrl,
      createdAt: record.createdAt,
      dimensions: record.embedding.length,
    },
  });
}