import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth/apiKeys";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = (req.headers.get("Authorization") || "").slice(7);
  const auth = await verifyApiKey(token);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const lawyer = await prisma.lawyerRegistration.findFirst({ where: { userId: auth.userId, status: "APPROVED" } });
  if (!lawyer) return NextResponse.json({ error: "Not an approved lawyer" }, { status: 403 });

  const body = await req.json();
  const { caseId, fileUrl, fileName, evidenceType } = body;
  if (!caseId || !fileUrl) return NextResponse.json({ error: "caseId and fileUrl required" }, { status: 400 });

  const lawyerCase = await prisma.lawyerCase.findFirst({ where: { id: caseId, lawyerRegistrationId: lawyer.id } });
  if (!lawyerCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const contentHash = crypto.createHash("sha256").update(fileUrl + Date.now().toString()).digest("hex");
  const evidence = await prisma.evidencePackage.create({
    data: {
      evidenceType: evidenceType || "lawyer_submission",
      evidenceUrl: fileUrl,
      contentHash,
      capturedBy: "LAWYER",
      reportId: lawyerCase.infringementReportId,
    },
  });
  return NextResponse.json({ success: true, data: evidence }, { status: 201 });
}