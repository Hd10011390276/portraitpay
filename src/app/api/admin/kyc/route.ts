import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !["SUPER_ADMIN", "ADMIN", "VERIFIER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const where: Record<string, unknown> = { deletedAt: null };
    if (status && status !== "ALL") {
      where.kycStatus = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true,
          kycStatus: true, kycVerifiedAt: true, kycLevel: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { users, meta: { page, limit, totalPages: Math.ceil(total / limit), total } },
    });
  } catch (error) {
    console.error("[GET /api/admin/kyc]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
