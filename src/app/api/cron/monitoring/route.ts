/**
 * Vercel Cron API — /api/cron/monitoring
 *
 * Configured in vercel.json:
 *   { "crons": [{ "path": "/api/cron/monitoring", "schedule": "0 * * * *" }] }
 *
 * Runs every hour. Secured via CRON_SECRET header in production.
 */

import { NextRequest, NextResponse } from "next/server";
import { runMonitoringCycle } from "@/lib/infringement/scanner";

export async function GET(request: NextRequest) {
  // ── Security: verify cron secret in production ───────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const providedSecret = request.headers.get("x-cron-secret");
    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log(`[Cron] Monitoring cycle triggered at ${new Date().toISOString()}`);

  try {
    const result = await runMonitoringCycle();

    return NextResponse.json(
      {
        ok: true,
        triggeredAt: new Date().toISOString(),
        alertsCreated: result.alertsCreated,
        portraitsScanned: result.portraitsScanned,
        urlsScanned: result.urlsScanned,
        errors: result.errors,
      },
      {
        status: 200,
        headers: {
          // Prevent Vercel from caching cron responses
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[Cron] Monitoring cycle failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        triggeredAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
