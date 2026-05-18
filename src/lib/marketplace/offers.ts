/**
 * Marketplace offer service
 * Handles offer lifecycle: create, accept, pay
 */

import { prisma } from "@/lib/prisma";
import { calculateMarketplaceSplit, validateOfferTerms } from "./fees";

export type CreateOfferInput = {
  fromUserId: string;
  toUserId: string;
  type: "LICENSE" | "LEGAL_SERVICE" | "CREATOR_SERVICE";
  title: string;
  terms: string;
  amount: number;
  currency?: string;
  requestId?: string;
  conversationId?: string;
  licensePackageId?: string;
  expiresAt?: Date;
};

export async function createOffer(input: CreateOfferInput) {
  const {
    fromUserId,
    toUserId,
    type,
    title,
    terms,
    amount,
    currency = "USD",
    requestId,
    conversationId,
    licensePackageId,
    expiresAt,
  } = input;

  const termsError = validateOfferTerms(terms);
  if (termsError) throw new Error(termsError);

  if (amount <= 0) throw new Error("Amount must be positive");

  const { platformFee, netPayout } = calculateMarketplaceSplit(amount);

  const offer = await prisma.offer.create({
    data: {
      fromUserId,
      toUserId,
      type,
      title,
      terms,
      amount,
      currency,
      platformFee,
      netPayout,
      requestId: requestId ?? null,
      conversationId: conversationId ?? null,
      licensePackageId: licensePackageId ?? null,
      expiresAt: expiresAt ?? null,
      status: "SENT",
    },
  });

  return offer;
}

export async function acceptOffer(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { request: true },
  });

  if (!offer) throw new Error("Offer not found");
  if (offer.toUserId !== userId) throw new Error("Only the recipient can accept this offer");
  if (offer.status !== "SENT") throw new Error(`Cannot accept offer in ${offer.status} status`);

  if (offer.expiresAt && offer.expiresAt < new Date()) {
    throw new Error("Offer has expired");
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Mark offer accepted
    const accepted = await tx.offer.update({
      where: { id: offerId },
      data: { status: "ACCEPTED" },
    });

    // Create deal in PENDING_PAYMENT
    const deal = await tx.deal.create({
      data: {
        offerId: accepted.id,
        payerId: accepted.toUserId,
        payeeId: accepted.fromUserId,
        amount: accepted.amount,
        currency: accepted.currency,
        platformFee: accepted.platformFee,
        netPayout: accepted.netPayout,
        status: "PENDING_PAYMENT",
      },
    });

    return { offer: accepted, deal };
  });

  return updated;
}

export async function markOfferPaid(
  offerId: string,
  stripePaymentIntentId: string
) {
  const deal = await prisma.deal.findUnique({
    where: { offerId },
    include: { offer: true },
  });

  if (!deal) throw new Error("Deal not found");
  if (deal.status !== "PENDING_PAYMENT") {
    throw new Error(`Deal is not pending payment: ${deal.status}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedDeal = await tx.deal.update({
      where: { id: deal.id },
      data: {
        status: "PAID",
        stripePaymentIntentId,
        paidAt: new Date(),
      },
    });

    await tx.offer.update({
      where: { id: offerId },
      data: { status: "PAID" },
    });

    // Credit payee balance
    await tx.balanceTransaction.create({
      data: {
        userId: deal.payeeId,
        sourceType: "DEAL",
        sourceId: deal.id,
        type: "CREDIT",
        amount: deal.netPayout,
        currency: deal.currency,
        status: "AVAILABLE",
        metadata: {
          dealId: deal.id,
          payerId: deal.payerId,
          platformFee: deal.platformFee,
        },
      },
    });

    return updatedDeal;
  });

  return updated;
}

export async function getOffersForUser(userId: string) {
  return prisma.offer.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    include: {
      request: { select: { id: true, title: true } },
      conversation: { select: { id: true, subject: true } },
      licensePackage: { select: { id: true, title: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}