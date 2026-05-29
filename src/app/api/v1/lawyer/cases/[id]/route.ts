import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = (req.headers.get("Authorization") || "").slice(7);
  const auth = await verifyApiKey(token);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const lawyer = await prisma.lawyerRegistration.findFirst({ where: { userId: auth.userId } });
  if (!lawyer) return NextResponse.json({ error: "Not a lawyer" }, { status: 403 });

  const c = await prisma.lawyerCase.findFirst({
    where: { id: params.id, lawyerRegistrationId: lawyer.id },
    include: {
      infringementReport: {
        include: {
          reporter: { select: { id: true, displayName: true, email: true } },
          portrait: { select: { id: true, title: true, owner: { select: { displayName: true } } } },
          evidencePackages: { select: { id: true, evidenceType: true, contentHash: true, capturedAt: true } },
        },
      },
    },
  });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: c });
}