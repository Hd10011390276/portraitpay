/**
 * GET /api/v1/export/earnings
 * Export user's earnings as CSV or PDF
 * Query params: format (csv|pdf), startDate, endDate
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { exportEarnings } from "@/lib/export/service";
import { logAudit } from "@/lib/audit/service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "csv").toLowerCase() as "csv" | "pdf";
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

    if (!["csv", "pdf"].includes(format)) {
      return NextResponse.json({ success: false, error: "format must be 'csv' or 'pdf'" }, { status: 400 });
    }

    const content = await exportEarnings({
      userId: session.userId,
      startDate,
      endDate,
      format,
    });

    // Log audit
    await logAudit({
      userId: session.userId,
      action: "EARNINGS_EXPORTED",
      success: true,
      detail: `导出收益报告（${format.toUpperCase()}），周期: ${startDate?.toISOString() ?? "全部"} ~ ${endDate?.toISOString() ?? "至今"}`,
      meta: { format, startDate: startDate?.toISOString(), endDate: endDate?.toISOString() },
    });

    const filename = `earnings_${new Date().toISOString().slice(0, 10)}.${format}`;
    const mimeType = format === "csv" ? "text/csv" : "application/pdf";

    // PDF returns Buffer, CSV returns string — normalise to Uint8Array for NextResponse
    const body = typeof content === "string"
      ? content
      : new Uint8Array(content as Buffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/export/earnings]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
