/**
 * PATCH /api/v1/notifications/[id]/read
 * Mark a single notification as read
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { markAsRead } from "@/lib/notifications/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await markAsRead(params.id, session.userId);

    if (result.count === 0) {
      return NextResponse.json({ success: false, error: "通知不存在或已标记为已读" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "已标记为已读" });
  } catch (error) {
    console.error("[PATCH /api/v1/notifications/:id/read]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
