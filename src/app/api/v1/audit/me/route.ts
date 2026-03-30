/**
 * GET /api/v1/audit/me
 * Get current user's own audit log
 * Query params: page, limit, action, startDate, endDate, success
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listAuditLogs, AUDIT_ACTION_LABELS } from "@/lib/audit/service";
import type { UserAuditAction } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const action = searchParams.get("action") as UserAuditAction | null;
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
    const successParam = searchParams.get("success");
    const success = successParam === "true" ? true : successParam === "false" ? false : undefined;

    const result = await listAuditLogs({
      userId: session.userId,
      action: action ?? undefined,
      startDate,
      endDate,
      page,
      limit,
      success,
    });

    // Add human-readable labels
    const logsWithLabels = result.logs.map((log) => ({
      ...log,
      actionLabel: AUDIT_ACTION_LABELS[log.action as UserAuditAction] ?? log.action,
    }));

    return NextResponse.json({
      success: true,
      logs: logsWithLabels,
      meta: result.meta,
    });
  } catch (error) {
    console.error("[GET /api/v1/audit/me]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
