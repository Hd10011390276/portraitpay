import { prisma } from "@/lib/prisma";

export async function deleteCase(caseId: string) {
  const lawyerCase = await prisma.lawyerCase.findUnique({
    where: { id: caseId },
    include: { infringementReport: { select: { id: true } } },
  });
  if (!lawyerCase) return { success: false, error: "Case not found" };

  const reportId = lawyerCase.infringementReportId;

  await prisma.evidenceExport.deleteMany({ where: { caseId } });
  await prisma.conversation.deleteMany({ where: { lawyerCaseId: caseId } });
  await prisma.conversation.updateMany({
    where: { infringementReportId: reportId },
    data: { infringementReportId: null },
  });
  await prisma.lawyerCase.delete({ where: { id: caseId } });
  if (reportId) {
    await prisma.infringementReport.delete({ where: { id: reportId } }).catch(() => {});
  }

  return { success: true };
}
