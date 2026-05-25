/**
 * GET /api/cron/voice-warmup
 * Pre-warms the Modal ECAPA-TDNN voice service to prevent cold start delays.
 * Called every 10 minutes by an external cron job.
 *
 * Expected cron setup:
 *   curl -m 55 https://portraitpayai.com/api/cron/voice-warmup
 *   (runs every 10 min via external service: cron-job.org, updator, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VOICE_SERVICE_URL = "https://hd10011390276--portraitpay-voice-final-web.modal.run";

export async function GET(req: NextRequest) {
  // Simple auth: check for cron secret header (optional, set via env CRON_SECRET)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
  }

  const start = Date.now();

  try {
    // Warm up the /embed endpoint with a tiny silent audio payload
    // This triggers ECAPA-TDNN model loading on Modal's GPU instance
    const warmupData = new Uint8Array(16000 * 1); // 1 second of silence at 16kHz
    const blob = new Blob([warmupData], { type: "audio/wav" });
    const form = new FormData();
    form.append("file", blob, "warmup.wav");

    const response = await fetch(`${VOICE_SERVICE_URL}/embed`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(55_000),
    });

    const elapsed = Date.now() - start;

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          service: "modal",
          status: response.status,
          elapsed,
          message: "Modal service responded with error",
        },
        { status: 502 }
      );
    }

    const data = await response.json() as { embedding?: number[]; duration?: number };

    return NextResponse.json({
      success: true,
      service: "modal",
      elapsed,
      hasEmbedding: Array.isArray(data.embedding) && data.embedding.length > 0,
      duration: data.duration ?? null,
      warmedAt: new Date().toISOString(),
    });
  } catch (err) {
    const elapsed = Date.now() - start;
    const message = err instanceof Error ? err.message : "Unknown error";
    Sentry.captureException(err, {
      extra: { route: "/api/cron/voice-warmup", elapsed },
    });
    // Don't block the cron — return degraded status
    return NextResponse.json(
      {
        success: false,
        service: "modal",
        elapsed,
        message,
        warmedAt: new Date().toISOString(),
      },
      { status: 200 } // 200 so cron doesn't keep retrying aggressively
    );
  }
}