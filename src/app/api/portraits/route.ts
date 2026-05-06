import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

// POST /api/portraits — Create a new portrait draft
const CreatePortraitSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(50).default("general"),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  imageHash: z.string().regex(/^[a-f0-9]{64}$/, "Must be a valid SHA-256 hex string").optional(),
  portraitImageHash: z.string().regex(/^[a-f0-9]{64}$/, "Must be a valid SHA-256 hex string").optional(),
  idCardFrontHash: z.string().regex(/^[a-f0-9]{64}$/, "Must be a valid SHA-256 hex string").optional(),
  idCardType: z.enum(["driver_license", "us_id", "passport", "other"]).optional(),
  idCardName: z.string().max(100).optional(),
  idCardNumber: z.string().max(50).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    const where: Record<string, unknown> = { deletedAt: null };
    if (ownerId) where.ownerId = ownerId;
    else if (session?.userId) where.ownerId = session.userId;
    else return NextResponse.json({ success: true, data: [], meta: { page, limit, total: 0, totalPages: 0 } });
    if (status) where.status = status;
    if (category) where.category = category;

    const [portraits, total] = await Promise.all([
      prisma.portrait.findMany({
        where,
        select: {
          id: true, ownerId: true, title: true, description: true, category: true,
          tags: true, originalImageUrl: true, thumbnailUrl: true, imageHash: true,
          portraitImageHash: true, idCardFrontHash: true,
          idCardType: true, idCardName: true,
          blockchainTxHash: true, blockchainNetwork: true, certifiedAt: true,
          status: true, isPublic: true, createdAt: true,
          updatedAt: true, deletedAt: true,
          owner: { select: { id: true, displayName: true, walletAddress: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.portrait.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: portraits, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[GET /api/portraits]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreatePortraitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, category, tags, isPublic, imageHash, portraitImageHash, idCardFrontHash, idCardType, idCardName, idCardNumber } = parsed.data;

  try {
    const portrait = await prisma.portrait.create({
      data: {
        title,
        description,
        category,
        tags,
        isPublic,
        imageHash: imageHash ?? null,
        portraitImageHash: portraitImageHash ?? null,
        idCardFrontHash: idCardFrontHash ?? null,
        idCardType: idCardType ?? null,
        idCardName: idCardName ?? null,
        idCardNumber: idCardNumber ?? null,
        ownerId: session.userId,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ success: true, data: portrait }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/portraits]", error);
    return NextResponse.json({ success: false, error: "创建肖像记录失败，请重试。" }, { status: 500 });
  }
}
