/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count for current user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/notifications/service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const count = await getUnreadCount(session.userId);
    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error("[GET /api/v1/notifications/unread-count]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
