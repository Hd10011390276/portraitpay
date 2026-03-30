/**
 * GET /api/v1/export/authorizations
 * Export user's authorization records as CSV or PDF
 * Query params: format (csv|pdf), status
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { exportAuthorizations } from "@/lib/export/service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "csv").toLowerCase() as "csv" | "pdf";
    const status = searchParams.get("status") ?? undefined;

    if (!["csv", "pdf"].includes(format)) {
      return NextResponse.json({ success: false, error: "format must be 'csv' or 'pdf'" }, { status: 400 });
    }

    const content = await exportAuthorizations({
      userId: session.userId,
      status,
      format,
    });

    const filename = `authorizations_${new Date().toISOString().slice(0, 10)}.${format}`;
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
    console.error("[GET /api/v1/export/authorizations]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
