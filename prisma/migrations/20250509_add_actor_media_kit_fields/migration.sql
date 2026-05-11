-- Add actor media kit fields to User model
ALTER TABLE "User" ADD COLUMN "mediaKitUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "mediaKitShareConfirmed" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "mediaKitReviewOnlyAcknowledged" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "mediaKitVisibility" TEXT DEFAULT 'PRIVATE';