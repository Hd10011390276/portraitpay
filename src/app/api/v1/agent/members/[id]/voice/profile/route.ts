/**
 * GET /api/v1/agent/members/[id]/voice/profile
 * Get voice embedding status for a member.
 * Requires agency admin authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agency = await authenticateRequest(req);
    if (!agency) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agencyAccount = await prisma.agencyAccount.findUnique({ where: { userId: agency.userId } });
    if (!agencyAccount) {
      return NextResponse.json({ success: false, error: "Not an agent" }, { status: 403 });
    }

    const member = await prisma.iPMember.findUnique({ where: { id: params.id } });
    if (!member || member.agencyId !== agencyAccount.id) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    if (!member.userId) {
      return NextResponse.json({
        success: true,
        data: { hasEmbedding: false, registered: false, noAccount: true },
      });
    }

    const record = await prisma.voiceEmbedding.findUnique({
      where: { userId: member.userId },
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
  } catch (err) {
    console.error("[GET /api/v1/agent/members/[id]/voice/profile]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}