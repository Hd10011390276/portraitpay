
/**
 * POST /api/v1/payments/initiate
 * Initialize a Stripe payment for license authorization
 *
 * Body:
 *   authorizationId: string
 *   amount: number (in cents, e.g. 5000 = ¥50.00)
 *   currency?: string (default: "cny")
 *   description?: string
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, getSessionFromRequest } from "@/lib/auth/session";
import { createPaymentIntent } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";


const InitiatePaymentSchema = z.object({
  authorizationId: z.string().min(1),
  amount: z.number().positive().int(),
  currency: z.string().default("cny"),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = InitiatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { authorizationId, amount, currency, description } = parsed.data;

    // Validate authorization exists and is payable
    const auth = await prisma.authorization.findUnique({
      where: { id: authorizationId },
      include: { portrait: { select: { id: true, ownerId: true } } },
    });

    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authorization not found" },
        { status: 404 }
      );
    }

    if (auth.granteeId !== session.userId) {
      return NextResponse.json(
        { success: false, error: "Only the grantee can initiate payment" },
        { status: 403 }
      );
    }

    if (auth.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Authorization is not in PENDING status" },
        { status: 400 }
      );
    }

    // Create Stripe Payment Intent
    const result = await createPaymentIntent({
      amount,
      currency,
      ownerId: auth.portrait.ownerId,
      granteeId: session.userId,
      authorizationId,
      description,
    });

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/payments/initiate]", error);
    return NextResponse.json(
      { success: false, error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
