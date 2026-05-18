
/**
 * GET  /api/split - Health check for revenue split API
 * POST /api/split - Record a revenue split transaction
 *
 * Body: { portraitId,授权Id, amount, currency, payeeType, payeeId, platformFee, royaltyAmount }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";


const SplitRecordSchema = z.object({
  portraitId: z.string().min(1, "Portrait ID is required"),
  authorizationId: z.string().min(1, "Authorization ID is required").optional(),
  transactionHash: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("CNY"),
  payeeType: z.enum(["CELEBRITY", "ENTERPRISE", "AGENCY", "PLATFORM"]),
  payeeId: z.string().min(1, "Payee ID is required"),
  platformFee: z.number().min(0).default(0),
  royaltyAmount: z.number().positive("Royalty amount must be positive"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Revenue Split API is operational",
    endpoints: {
      GET: "Health check",
      POST: "Record a revenue split transaction",
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SplitRecordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      portraitId,
      authorizationId,
      transactionHash,
      amount,
      currency,
      payeeType,
      payeeId,
      platformFee,
      royaltyAmount,
      metadata,
    } = parsed.data;

    // Verify portrait exists
    const portrait = await prisma.portrait.findUnique({
      where: { id: portraitId },
      include: {
        owner: {
          select: { id: true, displayName: true },
        },
      },
    });

    if (!portrait) {
      return NextResponse.json(
        { success: false, error: "Portrait not found" },
        { status: 404 }
      );
    }

    // Create revenue split record using Transaction model
    // Type: LICENSE_PURCHASE for amount, ROYALTY_PAYOUT for royaltyAmount
    const transaction = await prisma.transaction.create({
      data: {
        userId: portrait.owner.id,
        type: transactionHash ? "ROYALTY_PAYOUT" : "LICENSE_PURCHASE",
        status: transactionHash ? "COMPLETED" : "PENDING",
        amount,
        currency,
        authorizationId: authorizationId ?? null,
        royaltyRecipient: payeeId,
        royaltyPaid: !!transactionHash,
        royaltyTxHash: transactionHash ?? null,
        metadata: {
          portraitId,
          payeeType,
          platformFee,
          royaltyAmount,
          ...metadata,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Revenue split recorded successfully",
        data: {
          transactionId: transaction.id,
          portraitId,
          amount,
          royaltyAmount,
          platformFee,
          status: transaction.status,
          recordedAt: transaction.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/split]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
