import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "LAWYER") {
    return NextResponse.json({ success: false, error: "Lawyers only" }, { status: 403 });
  }

  const { reportId } = await req.json().catch(() => ({}));

  if (!reportId || typeof reportId !== "string") {
    return NextResponse.json({ success: false, error: "reportId is required" }, { status: 400 });
  }

  // Check the infringement report exists and is VALIDATED
  const report = await prisma.infringementReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
  }

  if (report.status !== "VALIDATED") {
    return NextResponse.json(
      { success: false, error: "Report is not available for assignment" },
      { status: 400 }
    );
  }

  // Get lawyer's registration
  const registration = await prisma.lawyerRegistration.findFirst({
    where: { userId: session.userId, status: "APPROVED" },
  });

  if (!registration) {
    return NextResponse.json(
      { success: false, error: "No approved lawyer registration found" },
      { status: 403 }
    );
  }

  // Check if already has a case for this report
  const existingCase = await prisma.lawyerCase.findUnique({
    where: { infringementReportId: reportId },
  });

  if (existingCase) {
    return NextResponse.json(
      { success: false, error: "Case already assigned to a lawyer" },
      { status: 409 }
    );
  }

  // Create LawyerCase + Conversation in a transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the case
      const lawyerCase = await tx.lawyerCase.create({
        data: {
          infringementReportId: reportId,
          lawyerRegistrationId: registration.id,
          status: "IN_PROGRESS",
          platformConfirmed: true,
        },
      });

      // Create conversation for this case
      const conversation = await tx.conversation.create({
        data: {
          type: "LAWYER_CASE",
          subject: `Case: ${report.type}`,
          status: "OPEN",
          infringementReportId: reportId,
          lawyerCaseId: lawyerCase.id,
          participants: {
            create: [{ userId: session.userId }],
          },
        },
      });

      return { lawyerCase, conversation };
    });

    return NextResponse.json({
      success: true,
      data: {
        caseId: result.lawyerCase.id,
        conversationId: result.conversation.id,
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Case already assigned to a lawyer" },
        { status: 409 }
      );
    }
    throw err;
  }
}