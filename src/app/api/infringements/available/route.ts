import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "LAWYER") {
    return NextResponse.json({ success: false, error: "Lawyers only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
  const type = searchParams.get("type") ?? undefined;
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {
    status: "VALIDATED",
  };

  if (type) {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { portrait: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const reports = await prisma.infringementReport.findMany({
    where,
    include: {
      portrait: { select: { id: true, title: true, thumbnailUrl: true } },
      reporter: { select: { id: true, displayName: true, email: true } },
    },
    orderBy: { verifiedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Filter out reports that already have a LawyerCase assigned
  const reportsWithCase = await Promise.all(
    reports.map(async (r) => {
      const lc = await prisma.lawyerCase.findUnique({ where: { infringementReportId: r.id } });
      return { report: r, hasCase: !!lc };
    })
  );

  const filtered = reportsWithCase.filter((r) => !r.hasCase).map((r) => r.report);
  const total = await prisma.infringementReport.count({ where });

  return NextResponse.json({
    success: true,
    data: filtered,
    meta: { page, limit, total },
  });
}