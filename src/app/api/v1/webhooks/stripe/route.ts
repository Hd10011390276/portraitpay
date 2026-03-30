/**
 * POST /api/v1/webhooks/stripe
 * Handle incoming Stripe webhook events
 */

import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/payments/stripe";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const result = await handleStripeWebhook(payload, signature);

    if (!result.received) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[POST /api/v1/webhooks/stripe]", error);
    return NextResponse.json(
      { success: false, error: "Webhook handler error" },
      { status: 500 }
    );
  }
}
