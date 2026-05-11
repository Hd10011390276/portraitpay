-- Add actor classification fields
ALTER TABLE "Portrait" ADD COLUMN "gender" TEXT;
ALTER TABLE "Portrait" ADD COLUMN "roleType" TEXT;
ALTER TABLE "Portrait" ADD COLUMN "productionType" TEXT;