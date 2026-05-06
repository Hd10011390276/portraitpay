-- Migration: add_kyc_oss_ipfs_ai_license_fields
-- Adds missing Portrait columns for KYC OSS/IPFS URLs and AI licensing
BEGIN;

ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "portraitImageIpfsUrl" TEXT;
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "idCardFrontIpfsUrl" TEXT;
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "portraitImageOssUrl" TEXT;
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "idCardFrontOssUrl" TEXT;
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "faceVerifiedAt" TIMESTAMP;
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "allowAiLicensing" BOOLEAN;
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "aiLicenseFee" DECIMAL(12,2);
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "aiLicenseScopes" TEXT[] DEFAULT '{}';
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "aiProhibitedScopes" TEXT[] DEFAULT '{}';
ALTER TABLE "Portrait" ADD COLUMN IF NOT EXISTS "aiTerritorialScope" TEXT DEFAULT 'global';

COMMIT;
