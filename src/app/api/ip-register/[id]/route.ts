/**
 * GET /api/ip-register/[id] — Get single AI content + registration detail
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const record = await prisma.aIContent.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, displayName: true, email: true, walletAddress: true } },
        ipRegistrations: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    if (record.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("[GET /api/ip-register/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
