import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

// GET — List all folders for the authenticated agency, with member count
export async function GET(req: NextRequest) {
  try {
    const agency = await authenticateRequest(req);
    if (!agency) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agencyAccount = await prisma.agencyAccount.findUnique({ where: { userId: agency.userId } });
    if (!agencyAccount) {
      return NextResponse.json({ success: false, error: "Not an agent" }, { status: 403 });
    }

    const folders = await prisma.memberFolder.findMany({
      where: { agencyId: agencyAccount.id },
      include: { _count: { select: { members: true } } },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: folders });
  } catch (err) {
    console.error("[GET /api/v1/agent/folders]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST — Create a new folder
export async function POST(req: NextRequest) {
  try {
    const agency = await authenticateRequest(req);
    if (!agency) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agencyAccount = await prisma.agencyAccount.findUnique({ where: { userId: agency.userId } });
    if (!agencyAccount) {
      return NextResponse.json({ success: false, error: "Not an agent" }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Folder name is required" }, { status: 400 });
    }

    const maxSort = await prisma.memberFolder.findFirst({
      where: { agencyId: agencyAccount.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const folder = await prisma.memberFolder.create({
      data: {
        agencyId: agencyAccount.id,
        name: name.trim(),
        sortOrder: (maxSort?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ success: true, data: folder }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/agent/folders]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}