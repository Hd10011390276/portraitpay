import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/contracts/unlock
 * Verifies payment and returns unlock confirmation.
 *
 * Request body: { email: string; txId: string; contractName: string }
 * Response: { unlocked: true } | { error: string }
 *
 * TODO (operator): Integrate real payment verification here.
 *  - For PayPal: verify order ID via PayPal API
 *  - For Stripe: verify payment intent via Stripe API
 *  - Store verified payments in Supabase to prevent replay
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; txId?: string; contractName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, txId, contractName } = body;

  if (!email?.trim() || !txId?.trim() || !contractName?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Allowed contract names
  const ALLOWED_CONTRACTS = [
    "00-Overview-and-Signing-Guide",
    "01-Standard-License-Agreement",
    "02-Exclusive-License-Agreement",
    "03-Endorsement-License-Agreement",
    "04-Film-Adaptation-License-Agreement",
  ];

  if (!ALLOWED_CONTRACTS.includes(contractName)) {
    return NextResponse.json({ error: "Invalid contract" }, { status: 400 });
  }

  // TODO (operator): Real payment verification
  // For now, accept any non-empty email + txId as a stub.
  // In production:
  //  - For PayPal: GET /v2/checkout/orders/{txId} via PayPal REST API
  //  - For Stripe: GET /v1/payment_intents/{txId} via Stripe API
  //  - Verify amount = $1 USD, currency = USD, status = "succeeded"
  //  - Store txId in Supabase to prevent replay attacks

  console.log(`[contracts/unlock] Unlock request: email=${email}, txId=${txId}, contract=${contractName}, user=${session.user.id}`);

  return NextResponse.json({ unlocked: true });
}
