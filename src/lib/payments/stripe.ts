/**
 * Stripe Payment Service
 * Handles payment intents, webhooks, transfers, and payout management
 *
 * Architecture:
 * - Payment Intent: charge buyer (grantee)
 * - Transfer: send 99% to portrait owner's Stripe Connect account
 * - Payout: withdraw to bank account (initiated by user withdrawal)
 */

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { calculateSplit } from "@/lib/revenue/service";

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripe;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatePaymentIntentInput = {
  amount: number;         // in smallest currency unit (cents / 分)
  currency?: string;
  ownerId: string;        // 肖像所有者（收款方）
  granteeId: string;      // 付款方
  authorizationId: string;
  description?: string;
  metadata?: Record<string, string>;
};

export type PaymentIntentResult = {
  clientSecret: string;
  paymentIntentId: string;
};

// ─── Create Payment Intent ───────────────────────────────────────────────────

/**
 * Create a Stripe Payment Intent for license purchase
 * Automatically splits: 99% to owner, 1% to platform
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult> {
  const {
    amount,
    currency = "cny",
    ownerId,
    granteeId,
    authorizationId,
    description,
    metadata,
  } = input;

  // Get owner's Stripe account (if they have connected Stripe)
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { stripeCustomerId: true },
  });

  const split = calculateSplit(amount / 100); // convert from cents
  const ownerAmountCents = Math.round(split.ownerRevenue * 100);
  const platformFeeCents = Math.round(split.platformFee * 100);

  // Build payment intent with automatic transfer to owner
  const params: Stripe.PaymentIntentCreateParams = {
    amount,
    currency,
    description: description ?? `PortraitPay AI - License Authorization #${authorizationId}`,
    metadata: {
      ...metadata,
      ownerId,
      granteeId,
      authorizationId,
      grossAmount: String(split.gross),
      platformFee: String(split.platformFee),
      ownerRevenue: String(split.ownerRevenue),
      splitRate: "90/10",
    },
    automatic_payment_methods: { enabled: true },
  };

  // If owner has Stripe Connect, set up for direct payment to them
  if (owner?.stripeCustomerId) {
    params.application_fee_amount = platformFeeCents; // Platform earns 1%
    // params.transfer_data = { destination: owner.stripeCustomerId };
  }

  const paymentIntent = await getStripe().paymentIntents.create(params);

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

// ─── Confirm & Record Transaction ─────────────────────────────────────────────

/**
 * Called after Stripe confirms payment succeeded
 * Records the transaction and royalty payout
 * Idempotent: uses stripePaymentIntentId unique constraint to prevent duplicates
 */
export async function onPaymentSuccess(paymentIntentId: string) {
  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new Error(`Payment not succeeded: ${paymentIntent.status}`);
  }

  const { ownerId, granteeId, authorizationId } =
    paymentIntent.metadata;

  if (!ownerId || !granteeId || !authorizationId) {
    throw new Error("Missing metadata in payment intent");
  }

  const split = calculateSplit(Number(paymentIntent.amount) / 100);

  // Idempotency: skip if transaction already exists for this payment intent
  const existingTx = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (existingTx) {
    return { success: true, duplicated: true };
  }

  // Single LICENSE_PURCHASE transaction for the payer with full payment details
  await prisma.transaction.create({
    data: {
      userId: granteeId,
      type: "LICENSE_PURCHASE",
      status: "COMPLETED",
      amount: split.gross,
      currency: paymentIntent.currency.toUpperCase(),
      authorizationId,
      stripePaymentIntentId: paymentIntentId,
      metadata: {
        grossAmount: split.gross,
        platformFee: split.platformFee,
        ownerRevenue: split.ownerRevenue,
        splitRate: "90/10",
        portraitOwnerId: ownerId,
      },
    },
  });

  // Idempotent: activate authorization regardless of PENDING or PENDING_PAYMENT
  await prisma.authorization.updateMany({
    where: { id: authorizationId, status: { in: ["PENDING", "PENDING_PAYMENT"] } },
    data: { status: "ACTIVE" },
  });

  // Create License record if none exists
  const existingLicense = await prisma.license.findFirst({
    where: { authorizationId },
  });
  if (!existingLicense) {
    const auth = await prisma.authorization.findUnique({
      where: { id: authorizationId },
      select: { portraitId: true, granteeId: true, startDate: true, endDate: true },
    });
    if (auth) {
      await prisma.license.create({
        data: {
          authorizationId,
          portraitId: auth.portraitId,
          licenseeId: auth.granteeId,
          startDate: auth.startDate ?? new Date(),
          endDate: auth.endDate ?? null,
        },
      });
    }
  }

  return { success: true, transactionId: authorizationId };
}

// ─── Stripe Webhook Handler ───────────────────────────────────────────────────

export type StripeWebhookEvent =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payout.paid"
  | "payout.failed";

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  payload: string,
  signature: string
): Promise<{ received: boolean; error?: string }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    return { received: false, error: "Invalid webhook signature" };
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        await onPaymentSuccess(pi.id);
      } catch (err) {
        console.error("[Stripe Webhook] onPaymentSuccess error:", err);
        return { received: false, error: String(err) };
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      // Mark related transactions as FAILED
      await prisma.transaction.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: { status: "FAILED" },
      });
      break;
    }

    case "payout.paid": {
      // A Stripe payout succeeded (withdrawal to bank)
      const payout = event.data.object as Stripe.Payout;
      await prisma.withdrawal.updateMany({
        where: { stripePayoutId: payout.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      break;
    }

    case "payout.failed": {
      const payout = event.data.object as Stripe.Payout;
      await prisma.withdrawal.updateMany({
        where: { stripePayoutId: payout.id },
        data: {
          status: "FAILED",
          rejectionReason: payout.failure_message ?? payout.failure_code ?? "Payout failed",
        },
      });
      break;
    }
  }

  return { received: true };
}

// ─── Withdrawal Payout via Stripe ─────────────────────────────────────────────

export type InitiateWithdrawalInput = {
  withdrawalId: string;
  stripeCustomerId?: string; // User's Stripe customer ID (for payout)
  bankAccountToken?: string; // One-time bank account token from Stripe.js
  amount: number;            // in cents
  currency?: string;
};

/**
 * Initiate a bank payout via Stripe
 * This is the async part of withdrawal - funds are sent to user's bank
 */
export async function initiateStripePayout(
  input: InitiateWithdrawalInput
): Promise<{ payoutId: string }> {
  const { withdrawalId, stripeCustomerId, amount, currency = "cny" } = input;

  // Get withdrawal record
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    select: { amount: true, currency: true, userId: true },
  });

  if (!withdrawal) throw new Error("Withdrawal not found");

  // Update status to processing
  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "PROCESSING" },
  });

  try {
    // Create a Stripe payout
    const payout = await getStripe().payouts.create(
      {
        amount,
        currency,
        metadata: { withdrawalId },
      },
      {
        stripeAccount: stripeCustomerId, // Connected account if applicable
      }
    );

    // Update withdrawal with payout ID
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        stripePayoutId: payout.id,
        processedAt: new Date(),
      },
    });

    return { payoutId: payout.id };
  } catch (err) {
    // Revert status
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "PENDING" },
    });
    throw err;
  }
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export async function refundPayment(
  paymentIntentId: string,
  amount?: number // partial refund amount in cents
): Promise<{ refundId: string }> {
  const refund = await getStripe().refunds.create({
    payment_intent: paymentIntentId,
    amount, // undefined = full refund
  });

  await prisma.transaction.updateMany({
    where: { stripePaymentIntentId: paymentIntentId },
    data: { status: "REFUNDED" },
  });

  return { refundId: refund.id };
}

// ─── Create Stripe Customer (for Connect payouts) ────────────────────────────

export async function createStripeCustomer(userId: string, email: string) {
  const customer = await getStripe().customers.create({
    email,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer;
}

// ─── Generate Stripe Account Link (for KYC/Connect onboarding) ──────────────

export async function createAccountLink(stripeCustomerId: string, returnUrl: string) {
  const accountLink = await getStripe().accountLinks.create({
    account: stripeCustomerId,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return accountLink;
}
