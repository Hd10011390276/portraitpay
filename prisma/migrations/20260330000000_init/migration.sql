-- Create all PortraitPay tables
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT cuid(),
    email TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT,
    phone TEXT UNIQUE,
    role TEXT DEFAULT 'USER',
    "kycStatus" TEXT DEFAULT 'NOT_STARTED',
    "kycProviderRef" TEXT,
    "kycVerifiedAt" TIMESTAMP,
    "kycExpiredAt" TIMESTAMP,
    "walletAddress" TEXT UNIQUE,
    "stripeCustomerId" TEXT,
    "displayName" TEXT,
    bio TEXT,
    "otpCode" TEXT,
    "otpExpires" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),
    "deletedAt" TIMESTAMP
);

CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");
CREATE INDEX "User_kycStatus_idx" ON "User"("kycStatus");

CREATE TABLE "Portrait" (
    id TEXT PRIMARY KEY DEFAULT cuid(),
    "ownerId" TEXT NOT NULL REFERENCES "User"(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    "originalImageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "imageHash" TEXT UNIQUE,
    "blockchainTxHash" TEXT UNIQUE,
    "blockchainNetwork" TEXT DEFAULT 'sepolia',
    "ipfsCid" TEXT,
    "certifiedAt" TIMESTAMP,
    status TEXT DEFAULT 'DRAFT',
    "faceEmbedding" DOUBLE PRECISION[] DEFAULT '{}',
    "isPublic" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),
    "deletedAt" TIMESTAMP
);

CREATE INDEX "Portrait_ownerId_idx" ON "Portrait"("ownerId");
CREATE INDEX "Portrait_status_idx" ON "Portrait"(status);
CREATE INDEX "Portrait_imageHash_idx" ON "Portrait"("imageHash");

-- Add remaining tables...
