/**
 * POST /api/portraits/[id]/embedding
 * Save face embedding (128-d vector) for a portrait
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { embedding } = body;

    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        { success: false, error: "embedding must be an array of 128 numbers" },
        { status: 400 }
      );
    }

    const updated = await prisma.portrait.update({
      where: { id },
      data: { faceEmbedding: embedding },
    });

    return NextResponse.json({ success: true, faceEmbedding: updated.faceEmbedding });
  } catch (err) {
    console.error("[embedding] Error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
