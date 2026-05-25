import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key) return NextResponse.json({ success: false, error: "Key not found" }, { status: 404 });
  if (key.userId !== session.userId) return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });

  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });

  return NextResponse.json({ success: true });
}
