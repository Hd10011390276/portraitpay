-- Add three-view photo fields for celebrity/actor portraits
ALTER TABLE "Portrait" ADD COLUMN "frontViewUrl" TEXT;
ALTER TABLE "Portrait" ADD COLUMN "sideViewUrl" TEXT;
ALTER TABLE "Portrait" ADD COLUMN "backViewUrl" TEXT;
ALTER TABLE "Portrait" ADD COLUMN "threeViewHash" TEXT;