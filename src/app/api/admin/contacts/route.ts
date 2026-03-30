/**
 * /api/admin/contacts — 管理员获取所有联系记录
 * GET ?page=1&limit=20&status=&type=
 * PATCH  { id, status, adminNotes } 更新状态/备注
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple admin auth check — in production use proper session middleware
async function requireAdmin(token?: string | null): Promise<boolean> {
  if (!token) return false;
  // Token format: stored in localStorage as pp_access_token
  // Decode JWT to check role (simplified — use proper JWT verify in production)
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64").toString());
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.nextUrl.searchParams.get("token");
  const adminToken = req.cookies.get("pp_access_token")?.value ?? token;

  if (!adminToken) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
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
    prisma.contactSubmission.count({ ...where, status: "PROCESSING" }),
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
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.cookies.get("pp_access_token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
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
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}
