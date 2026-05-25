import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { generateApiKey } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const keys = await prisma.apiKey.findMany({
      where: { userId: session.userId },
      select: { id: true, name: true, keyPrefix: true, createdAt: true, lastUsedAt: true, revokedAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: keys });
  } catch (e: any) {
    console.error("[api-keys GET]", e);
    return NextResponse.json({ success: false, error: e.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ success: false, error: "name is required" }, { status: 400 });
  }

  const { rawKey, keyHash, prefix } = generateApiKey();

  await prisma.apiKey.create({
    data: { userId: session.userId, name: name.trim(), keyHash, keyPrefix: prefix },
  });

  return NextResponse.json({ success: true, data: { rawKey, prefix } }, { status: 201 });
}
