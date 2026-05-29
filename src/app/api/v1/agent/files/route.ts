import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const memberId = searchParams.get("memberId");
  const tag = searchParams.get("tag");

  const where: any = { agencyId: agency.id };
  if (category) where.category = category;
  if (memberId) where.memberId = memberId;
  if (tag) where.tags = { has: tag };

  const files = await prisma.memberDocument.findMany({
    where,
    include: { member: { select: { id: true, name: true } } },
    orderBy: { chainIndex: "asc" },
  });
  return NextResponse.json({ success: true, data: files });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!auth.scopes.includes("*") && !auth.scopes.includes("files:write")) return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });
  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const body = await req.json();
  const { fileName, fileUrl, memberId, category, tags, notes, fileSize, mimeType } = body;
  if (!fileName || !fileUrl) return NextResponse.json({ error: "fileName and fileUrl required" }, { status: 400 });

  const contentHash = crypto.createHash("sha256").update(fileUrl + Date.now().toString()).digest("hex");

  const lastFile = await prisma.memberDocument.findFirst({
    where: { agencyId: agency.id, memberId: memberId || null },
    orderBy: { chainIndex: "desc" },
  });
  const previousHash = lastFile?.contentHash || null;
  const chainIndex = (lastFile?.chainIndex ?? -1) + 1;

  const file = await prisma.memberDocument.create({
    data: {
      agencyId: agency.id,
      memberId: memberId || null,
      category: category || "OTHER",
      fileName,
      fileUrl,
      fileSize: fileSize || null,
      mimeType: mimeType || null,
      contentHash,
      previousHash,
      chainIndex,
      uploadedById: auth.userId,
      tags: tags || [],
      notes: notes || null,
    },
  });
  return NextResponse.json({ success: true, data: file }, { status: 201 });
}