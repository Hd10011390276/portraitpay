-- Add idCardFrontUrl to Portrait for KYC face verification at mint time
ALTER TABLE "Portrait" ADD COLUMN "idCardFrontUrl" TEXT;