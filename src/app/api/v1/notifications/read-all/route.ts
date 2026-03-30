/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read for current user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { markAllAsRead } from "@/lib/notifications/service";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await markAllAsRead(session.userId);
    return NextResponse.json({
      success: true,
      message: `已标记 ${result.count} 条通知为已读`,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    console.error("[PATCH /api/v1/notifications/read-all]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
