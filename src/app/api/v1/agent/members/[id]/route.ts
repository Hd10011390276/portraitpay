import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const member = await prisma.iPMember.findFirst({ where: { id: params.id, agencyId: agency.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.iPMember.update({
    where: { id: params.id },
    data: {
      name: body.name !== undefined ? body.name : undefined,
      email: body.email !== undefined ? body.email : undefined,
      phone: body.phone !== undefined ? body.phone : undefined,
      rightType: body.rightType || undefined,
      revenueShare: body.revenueShare != null ? Number(body.revenueShare) : undefined,
      territory: body.territory || undefined,
      status: body.status || undefined,
    },
  });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const member = await prisma.iPMember.findFirst({ where: { id: params.id, agencyId: agency.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.iPMember.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

// PATCH — Update member (e.g., move to folder)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
    if (!agency) return NextResponse.json({ success: false, error: "Not an agent" }, { status: 403 });

    const member = await prisma.iPMember.findFirst({ where: { id: params.id, agencyId: agency.id } });
    if (!member) return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });

    const body = await req.json();
    const { folderId } = body; // can be null to ungroup, or a folderId string to assign

    const updated = await prisma.iPMember.update({
      where: { id: params.id },
      data: { folderId: folderId ?? null },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/v1/agent/members/[id]]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}