/**
 * GET /api/portraits/[id]     — Get portrait by ID
 * PATCH /api/portraits/[id]   — Update portrait metadata
 * DELETE /api/portraits/[id]  — Soft-delete portrait
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";

const UpdatePortraitSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["DRAFT", "UNDER_REVIEW", "ACTIVE", "SUSPENDED", "ARCHIVED"]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: {
          select: { id: true, displayName: true, walletAddress: true, kycStatus: true },
        },
        _count: {
          select: { authorizations: true, reports: true },
        },
      },
    });

    if (!portrait) {
      return NextResponse.json(
        { success: false, error: "Portrait not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: portrait });
  } catch (error) {
    console.error("[GET /api/portraits/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = UpdatePortraitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: { ownerId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (existing.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Prevent status changes that don't follow the state machine
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ["UNDER_REVIEW", "ARCHIVED"],
      UNDER_REVIEW: ["ACTIVE", "SUSPENDED"],
      ACTIVE: ["SUSPENDED", "ARCHIVED"],
      SUSPENDED: ["ACTIVE", "ARCHIVED"],
    };

    if (parsed.data.status && parsed.data.status !== existing.status) {
      const allowed = allowedTransitions[existing.status] ?? [];
      if (!allowed.includes(parsed.data.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition from ${existing.status} to ${parsed.data.status}`,
            code: "PP-2002",
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.portrait.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/portraits/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
      select: { ownerId: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (existing.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    await prisma.portrait.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("[DELETE /api/portraits/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
