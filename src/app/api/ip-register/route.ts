/**
 * GET  /api/ip-register        — List user's AI content + registrations
 * POST /api/ip-register        — Register new AI content (draft)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const contentType = searchParams.get("contentType");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      ownerId: session.user.id,
      deletedAt: null,
    };

    if (status) where["ipRegistrations"] = { some: { status } };
    if (contentType) where.contentType = contentType;

    const [contents, total] = await Promise.all([
      prisma.aIContent.findMany({
        where,
        include: {
          ipRegistrations: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.aIContent.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: contents,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/ip-register]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      contentType = "CHARACTER",
      generationTool,
      generationPrompt,
      generationDate,
      modelVersion,
      cfgScale,
      seed,
      sampler,
      originalFileUrl,
      thumbnailUrl,
      fileSize,
      mimeType,
      contentHash,
      tags = [],
      copyrightNotice,
      licenseScope = [],
      isPublicDomain = false,
      thirdPartyRights = false,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    // Check for duplicate content hash
    if (contentHash) {
      const existing = await prisma.aIContent.findUnique({
        where: { contentHash, deletedAt: null },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "This content hash is already registered", code: "IP-3001" },
          { status: 409 }
        );
      }
    }

    // Generate certificate number
    const count = await prisma.iPRegistration.count();
    const certificateNo = `PP-IP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(count + 1).padStart(4, "0")}`;

    // Create AIContent + IPRegistration in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const aiContent = await tx.aIContent.create({
        data: {
          ownerId: session.user.id,
          title: title.trim(),
          description: description?.trim() || null,
          contentType,
          generationTool: generationTool?.trim() || null,
          generationPrompt: generationPrompt?.trim() || null,
          generationDate: generationDate ? new Date(generationDate) : null,
          modelVersion: modelVersion?.trim() || null,
          cfgScale: cfgScale ? parseFloat(cfgScale) : null,
          seed: seed?.toString() || null,
          sampler: sampler?.trim() || null,
          originalFileUrl: originalFileUrl || null,
          thumbnailUrl: thumbnailUrl || null,
          fileSize: fileSize ? parseInt(fileSize) : null,
          mimeType: mimeType || null,
          contentHash: contentHash || null,
          tags,
          copyrightNotice: copyrightNotice?.trim() || null,
          licenseScope,
          isPublicDomain,
          thirdPartyRights,
        },
      });

      const ipRegistration = await tx.iPRegistration.create({
        data: {
          aiContentId: aiContent.id,
          ownerId: session.user.id,
          title: title.trim(),
          description: description?.trim() || null,
          certificateNo,
          certificateType: "OWNERSHIP",
          rightsDeclared: ["reproduction", "distribution", "public_display"],
          territorialScope: "global",
          exclusivity: false,
          status: "DRAFT",
        },
      });

      return { aiContent, ipRegistration };
    });

    return NextResponse.json({
      success: true,
      data: {
        aiContent: result.aiContent,
        ipRegistration: result.ipRegistration,
      },
    });
  } catch (error) {
    console.error("[POST /api/ip-register]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
