import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { caseId?: string; signerName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { caseId, signerName } = body;

  // Validate inputs
  if (!caseId || typeof caseId !== "string" || caseId.trim().length === 0) {
    return NextResponse.json({ success: false, error: "caseId is required and must be a non-empty string" }, { status: 400 });
  }
  if (!signerName || typeof signerName !== "string" || signerName.trim().length < 2) {
    return NextResponse.json({ success: false, error: "signerName is required and must be at least 2 characters" }, { status: 400 });
  }

  // Verify lawyer owns this case
  const lawyer = await prisma.lawyerRegistration.findFirst({
    where: { userId: session.userId, status: "APPROVED" },
  });
  if (!lawyer) {
    return NextResponse.json({ success: false, error: "Not an approved lawyer" }, { status: 403 });
  }

  const lawyerCase = await prisma.lawyerCase.findFirst({
    where: { id: caseId.trim(), lawyerRegistrationId: lawyer.id },
  });
  if (!lawyerCase) {
    return NextResponse.json({ success: false, error: "Case not found or not owned by this lawyer" }, { status: 404 });
  }

  // Compute signature hash: SHA-256(caseId|signerName|timestamp|userId)
  const signedAt = new Date();
  const signatureInput = [
    caseId.trim(),
    signerName.trim(),
    signedAt.toISOString(),
    session.userId,
  ].join("|");
  const signatureHash = sha256(signatureInput);

  // Get client IP
  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  // Track in EvidenceExport table (unique constraint on caseId_fileHash — use signatureHash as fileHash)
  await prisma.evidenceExport.create({
    data: {
      caseId: caseId.trim(),
      lawyerId: lawyer.userId,
      fileHash: signatureHash,
      signedAt,
      signerName: signerName.trim(),
      signerIp: rawIp,
      signatureHash,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      caseId: caseId.trim(),
      signerName: signerName.trim(),
      signedAt: formatDate(signedAt),
      signatureHash,
    },
  });
}