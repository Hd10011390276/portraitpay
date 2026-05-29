import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

// PUT — Rename folder (verify agency ownership)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agency = await authenticateRequest(req);
    if (!agency) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agencyAccount = await prisma.agencyAccount.findUnique({ where: { userId: agency.userId } });
    if (!agencyAccount) {
      return NextResponse.json({ success: false, error: "Not an agent" }, { status: 403 });
    }

    const folder = await prisma.memberFolder.findUnique({ where: { id: params.id } });
    if (!folder || folder.agencyId !== agencyAccount.id) {
      return NextResponse.json({ success: false, error: "Folder not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name } = body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Folder name is required" }, { status: 400 });
    }

    const updated = await prisma.memberFolder.update({
      where: { id: params.id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PUT /api/v1/agent/folders/[id]]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Delete folder (members automatically become ungrouped via folderId = null)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agency = await authenticateRequest(req);
    if (!agency) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agencyAccount = await prisma.agencyAccount.findUnique({ where: { userId: agency.userId } });
    if (!agencyAccount) {
      return NextResponse.json({ success: false, error: "Not an agent" }, { status: 403 });
    }

    const folder = await prisma.memberFolder.findUnique({ where: { id: params.id } });
    if (!folder || folder.agencyId !== agencyAccount.id) {
      return NextResponse.json({ success: false, error: "Folder not found" }, { status: 404 });
    }

    // Move all members in this folder to ungrouped
    await prisma.iPMember.updateMany({
      where: { folderId: params.id },
      data: { folderId: null },
    });

    await prisma.memberFolder.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: "Folder deleted" });
  } catch (err) {
    console.error("[DELETE /api/v1/agent/folders/[id]]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}