/**
 * GET /api/portraits/[id]/three-view     — Get three-view Google Drive links
 * PATCH /api/portraits/[id]/three-view   — Update three-view links
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

const UpdateThreeViewSchema = z.object({
  threeViewFront: z.string().optional(),
  threeViewSide: z.string().optional(),
  threeViewTop: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        threeViewFront: true,
        threeViewSide: true,
        threeViewTop: true,
      },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        threeViewFront: portrait.threeViewFront,
        threeViewSide: portrait.threeViewSide,
        threeViewTop: portrait.threeViewTop,
      },
    });
  } catch (error) {
    console.error("[GET /api/portraits/[id]/three-view]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSessionFromRequest(request);

    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, ownerId: true },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    const isOwner = portrait.ownerId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateThreeViewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.portrait.update({
      where: { id },
      data: {
        threeViewFront: parsed.data.threeViewFront ?? undefined,
        threeViewSide: parsed.data.threeViewSide ?? undefined,
        threeViewTop: parsed.data.threeViewTop ?? undefined,
      },
      select: {
        id: true,
        threeViewFront: true,
        threeViewSide: true,
        threeViewTop: true,
      },
    });

    return NextResponse.json({ success: true, data: { ...updated } });
  } catch (error) {
    console.error("[PATCH /api/portraits/[id]/three-view]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}