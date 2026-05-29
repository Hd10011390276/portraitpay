import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const members = await prisma.iPMember.findMany({
    where: { agencyId: agency.id },
    include: { portrait: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: members });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!auth.scopes.includes("*") && !auth.scopes.includes("members:write")) return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });

  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const body = await req.json();
  const { name, email, phone, rightType, portraitId, revenueShare, territory } = body;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const member = await prisma.iPMember.create({
    data: {
      agencyId: agency.id,
      name,
      email: email || null,
      phone: phone || null,
      rightType: rightType || "OWNER",
      portraitId: portraitId || null,
      revenueShare: revenueShare != null ? Number(revenueShare) : 1.0,
      territory: territory || "global",
    },
  });
  return NextResponse.json({ success: true, data: member }, { status: 201 });
}