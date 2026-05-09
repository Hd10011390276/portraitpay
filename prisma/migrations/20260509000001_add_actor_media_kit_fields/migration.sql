-- Add Actor Media Kit fields to User model
ALTER TABLE "User" ADD COLUMN "mediaKitUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "mediaKitShareConfirmed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "mediaKitReviewOnlyAcknowledged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "mediaKitVisibility" TEXT NOT NULL DEFAULT 'PRIVATE';
