import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = (req.headers.get("Authorization") || "").slice(7);
  const { verifyApiKey } = await import("@/lib/auth/apiKeys");
  const { prisma } = await import("@/lib/prisma");
  const auth = await verifyApiKey(token);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const hook = await prisma.webhookConfig.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.webhookConfig.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}