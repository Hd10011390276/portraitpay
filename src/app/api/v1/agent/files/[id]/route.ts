import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const file = await prisma.memberDocument.findFirst({
    where: { id: params.id, agencyId: agency.id },
    include: { member: { select: { id: true, name: true } } },
  });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: file });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const file = await prisma.memberDocument.findFirst({ where: { id: params.id, agencyId: agency.id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.memberDocument.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}