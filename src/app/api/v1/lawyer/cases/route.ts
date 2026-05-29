import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = (req.headers.get("Authorization") || "").slice(7);
  const auth = await verifyApiKey(token);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const lawyer = await prisma.lawyerRegistration.findFirst({
    where: { userId: auth.userId, status: "APPROVED" },
  });
  if (!lawyer) return NextResponse.json({ error: "Not an approved lawyer" }, { status: 403 });

  const cases = await prisma.lawyerCase.findMany({
    where: { lawyerRegistrationId: lawyer.id },
    include: {
      infringementReport: {
        select: { id: true, type: true, description: true, status: true, portrait: { select: { id: true, title: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ success: true, data: cases });
}