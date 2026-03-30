/**
 * GET /api/v1/admin/audit
 * Admin: view all user audit logs
 * Query params: page, limit, action, userId, targetType, startDate, endDate, success
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { adminListAuditLogs, AUDIT_ACTION_LABELS } from "@/lib/audit/service";
import type { UserAuditAction } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const action = searchParams.get("action") as UserAuditAction | null;
    const userId = searchParams.get("userId") ?? undefined;
    const targetType = searchParams.get("targetType") ?? undefined;
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
    const successParam = searchParams.get("success");
    const success = successParam === "true" ? true : successParam === "false" ? false : undefined;

    const result = await adminListAuditLogs({
      action: action ?? undefined,
      userId,
      targetType,
      startDate,
      endDate,
      page,
      limit,
      success,
    });

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
    console.error("[GET /api/v1/admin/audit]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
