import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hook = await prisma.webhookConfig.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.webhookConfig.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}