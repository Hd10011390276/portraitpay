import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { deleteCase } from "@/lib/cases/deleteCase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.role === "ADMIN" || session.role === "VERIFIER";
  if (session.role !== "LAWYER" && !isAdmin) {
    return NextResponse.json({ success: false, error: "Lawyers only" }, { status: 403 });
  }

  const lawyer = await prisma.lawyerRegistration.findFirst({
    where: { userId: session.userId, status: "APPROVED" },
  });
  if (!lawyer && !isAdmin) return NextResponse.json({ success: false, error: "No approved lawyer registration" }, { status: 403 });

  const { ids }: { ids?: string[] } = await req.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ success: false, error: "ids must be a non-empty array" }, { status: 400 });
  }

  const cases = await prisma.lawyerCase.findMany({
    where: { id: { in: ids } },
    select: { id: true, lawyerRegistrationId: true },
  });

  if (cases.length !== ids.length) {
    return NextResponse.json({ success: false, error: "One or more cases not found" }, { status: 404 });
  }

  if (!isAdmin && lawyer) {
    const unauthorized = cases.filter((c) => c.lawyerRegistrationId !== lawyer.id);
    if (unauthorized.length > 0) {
      return NextResponse.json({ success: false, error: "Access denied for one or more cases" }, { status: 403 });
    }
  }

  for (const caseId of ids) {
    await deleteCase(caseId);
  }

  return NextResponse.json({ success: true, deletedCount: ids.length });
}
