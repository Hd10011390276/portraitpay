-- Add marketplace monetization models
-- LicensePackage, MarketplaceRequest, Offer, Deal, FeePolicy, BalanceTransaction
-- Plus ConversationParticipant (join table) and Message model (if not exists)

-- LicensePackage
CREATE TABLE "LicensePackage" (
  "id" TEXT NOT NULL,
  "portraitId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "usageScope" TEXT[] NOT NULL,
  "prohibitedUses" TEXT[] NOT NULL,
  "territory" TEXT NOT NULL DEFAULT 'global',
  "durationDays" INTEGER NOT NULL DEFAULT 365,
  "price" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "LicensePackage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LicensePackage_portraitId_idx" ON "LicensePackage"("portraitId");
CREATE INDEX "LicensePackage_ownerId_idx" ON "LicensePackage"("ownerId");
CREATE INDEX "LicensePackage_isActive_idx" ON "LicensePackage"("isActive");

-- MarketplaceRequest
CREATE TABLE "MarketplaceRequest" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'LICENSING',
  "requesterId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "portraitId" TEXT,
  "conversationId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "budget" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "usageScope" TEXT[] NOT NULL,
  "territory" TEXT NOT NULL DEFAULT 'global',
  "deadline" TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "MarketplaceRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketplaceRequest_requesterId_idx" ON "MarketplaceRequest"("requesterId");
CREATE INDEX "MarketplaceRequest_status_idx" ON "MarketplaceRequest"("status");
CREATE INDEX "MarketplaceRequest_portraitId_idx" ON "MarketplaceRequest"("portraitId");
CREATE INDEX "MarketplaceRequest_type_idx" ON "MarketplaceRequest"("type");

-- Offer
CREATE TABLE "Offer" (
  "id" TEXT NOT NULL,
  "requestId" TEXT,
  "conversationId" TEXT,
  "licensePackageId" TEXT,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "terms" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "platformFee" DECIMAL(12,2) NOT NULL,
  "netPayout" DECIMAL(12,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Offer_fromUserId_idx" ON "Offer"("fromUserId");
CREATE INDEX "Offer_toUserId_idx" ON "Offer"("toUserId");
CREATE INDEX "Offer_status_idx" ON "Offer"("status");
CREATE INDEX "Offer_requestId_idx" ON "Offer"("requestId");
CREATE INDEX "Offer_conversationId_idx" ON "Offer"("conversationId");
CREATE INDEX "Offer_licensePackageId_idx" ON "Offer"("licensePackageId");

-- Deal
CREATE TABLE "Deal" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "payerId" TEXT NOT NULL,
  "payeeId" TEXT NOT NULL,
  "authorizationId" TEXT,
  "lawyerCaseId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  "amount" DECIMAL(12,2) NOT NULL,
  "platformFee" DECIMAL(12,2) NOT NULL,
  "netPayout" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "stripePaymentIntentId" TEXT,
  "paidAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "Deal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Deal_offerId_key" UNIQUE ("offerId")
);
CREATE INDEX "Deal_payerId_idx" ON "Deal"("payerId");
CREATE INDEX "Deal_payeeId_idx" ON "Deal"("payeeId");
CREATE INDEX "Deal_status_idx" ON "Deal"("status");
CREATE INDEX "Deal_stripePaymentIntentId_idx" ON "Deal"("stripePaymentIntentId");

-- FeePolicy
CREATE TABLE "FeePolicy" (
  "id" TEXT NOT NULL,
  "transactionType" TEXT NOT NULL,
  "platformFeeRate" DECIMAL(5,4) NOT NULL,
  "minFee" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "FeePolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FeePolicy_transactionType_key" UNIQUE ("transactionType")
);

-- BalanceTransaction
CREATE TABLE "BalanceTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "BalanceTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BalanceTransaction_userId_idx" ON "BalanceTransaction"("userId");
CREATE INDEX "BalanceTransaction_status_idx" ON "BalanceTransaction"("status");
CREATE INDEX "BalanceTransaction_sourceType_sourceId_idx" ON "BalanceTransaction"("sourceType", "sourceId");

-- ConversationParticipant
CREATE TABLE "ConversationParticipant" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleInConversation" TEXT NOT NULL DEFAULT 'CREATOR',
  "lastReadAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConversationParticipant_conversationId_userId_key" UNIQUE ("conversationId", "userId")
);
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");

-- Message (if table does not already exist — guard since it may already be there from prior migration)
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderType" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "conversationId" TEXT,
  "body" TEXT NOT NULL,
  "subject" TEXT,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");