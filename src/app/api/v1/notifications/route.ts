/**
 * GET /api/v1/notifications
 * List current user's notifications
 * Query params: page, limit, isRead (boolean), type
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listNotifications } from "@/lib/notifications/service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const isReadParam = searchParams.get("isRead");
    const type = searchParams.get("type") ?? undefined;

    const isRead = isReadParam === "true" ? true : isReadParam === "false" ? false : undefined;

    const result = await listNotifications({
      userId: session.userId,
      page,
      limit,
      isRead,
      type,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[GET /api/v1/notifications]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
