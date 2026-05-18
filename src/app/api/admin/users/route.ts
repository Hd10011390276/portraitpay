/**
 * GET /api/admin/users — list users (admin only)
 * GET ?page=1&limit=20&role=&search=
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const VIEWER_ROLES = ["SUPER_ADMIN", "ADMIN", "VERIFIER"];

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const role = searchParams.get("role") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: { id: true, email: true, displayName: true, role: true, createdAt: true, emailVerified: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}