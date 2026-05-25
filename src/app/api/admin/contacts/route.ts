
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "VERIFIER"];

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [data, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.contactSubmission.count({ where }),
  ]);

  // Stats
  const [newCount, processingCount] = await Promise.all([
    prisma.contactSubmission.count({ where: { ...where, status: "NEW" } }),
    prisma.contactSubmission.count({ where: { ...where, status: "PROCESSING" } }),
  ]);

  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      newCount,
      processingCount,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, adminNotes, repliedMessage } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少 id" }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      updateData.handledAt = new Date();
    }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (repliedMessage !== undefined) {
      updateData.repliedMessage = repliedMessage;
      updateData.repliedAt = new Date();
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ success: false, error: "记录不存在" }, { status: 404 });
    }
    console.error("[Admin/Contacts] PATCH error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.contactSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }
    console.error("[Admin/Contacts] DELETE error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
