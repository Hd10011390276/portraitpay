-- Migration: Add Celebrity table for face copyright fraud prevention
-- Run this migration on the PortraitPay database

CREATE TABLE IF NOT EXISTS "Celebrity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enName" TEXT,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "country" TEXT DEFAULT 'CN',
    "faceId" TEXT,
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Celebrity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Celebrity_category_idx" ON "Celebrity"("category");
CREATE INDEX IF NOT EXISTS "Celebrity_country_idx" ON "Celebrity"("country");
CREATE INDEX IF NOT EXISTS "Celebrity_faceId_idx" ON "Celebrity"("faceId");
