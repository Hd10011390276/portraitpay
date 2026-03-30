/**
 * GET /api/v1/earnings/summary
 * Get current user's earnings summary (as portrait owner)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getEarningsSummary } from "@/lib/revenue/service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency") ?? "CNY";

    const summary = await getEarningsSummary(session.userId, currency);

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("[GET /api/v1/earnings/summary]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
