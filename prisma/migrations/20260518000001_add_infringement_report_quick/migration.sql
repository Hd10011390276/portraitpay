-- Add InfringementReportQuick — quick intake for AI face theft victims
-- Provides free infringement report (PDF) as SEO acquisition funnel
CREATE TABLE "InfringementReportQuick" (
  "id" TEXT NOT NULL,
  "reportNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'GENERATED',
  "userId" TEXT NOT NULL,
  "reportedName" TEXT NOT NULL,
  "reportedEmail" TEXT NOT NULL,
  "phone" TEXT,
  "infringementType" TEXT NOT NULL,
  "platformUrl" TEXT,
  "platformName" TEXT,
  "description" TEXT,
  "evidenceUrls" TEXT[] NOT NULL,
  "originalImageUrl" TEXT,
  "reportPdfUrl" TEXT,
  "generatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "blockchainTxHash" TEXT,
  "upgradedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "InfringementReportQuick_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InfringementReportQuick_reportNumber_key" UNIQUE ("reportNumber")
);
CREATE INDEX "InfringementReportQuick_userId_idx" ON "InfringementReportQuick"("userId");
CREATE INDEX "InfringementReportQuick_reportNumber_idx" ON "InfringementReportQuick"("reportNumber");
CREATE INDEX "InfringementReportQuick_status_idx" ON "InfringementReportQuick"("status");