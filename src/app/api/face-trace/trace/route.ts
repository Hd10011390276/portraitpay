/**
 * POST /api/face-trace/trace
 *
 * Body:
 *   { imageData: string }   — base64-encoded image (data URL or raw base64)
 *   { minScore?: number }   — minimum similarity threshold (default 0.5)
 *   { topK?: number }        — max results (default 5)
 *
 * Response:
 *   { matches: CelebrityMatch[], queryId: string, provider: "face-api" }
 *
 * Flow:
 * 1. Decode base64 image → Buffer
 * 2. Extract face embedding (Aliyun server-side, face-api.js called from client)
 *    NOTE: face-api.js runs in the browser. Here we support Aliyun as server fallback.
 *    The primary flow is client-side embedding extraction → POST descriptor directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { queryCelebrityDb } from "@/lib/face-trace/celebrityDb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { descriptor, minScore = 0.5, topK = 5 } = body as {
      descriptor?: number[];
      imageData?: string;
      minScore?: number;
      topK?: number;
    };

    // Primary: client sends pre-extracted face descriptor
    if (descriptor && Array.isArray(descriptor)) {
      const matches = await queryCelebrityDb(descriptor, topK, minScore);
      return NextResponse.json({
        matches,
        queryId: crypto.randomUUID(),
        provider: "face-api",
        mode: "descriptor",
      });
    }

    // Fallback: server-side extraction from base64 image (Aliyun only)
    if (body.imageData) {
      const base64 = body.imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");

      const { extractFaceEmbeddingAliyun } = await import("@/lib/face");
      const result = await extractFaceEmbeddingAliyun(buffer);
      const matches = await queryCelebrityDb(result.embedding, topK, minScore);

      return NextResponse.json({
        matches,
        queryId: crypto.randomUUID(),
        provider: result.provider,
        mode: "server-extract",
      });
    }

    return NextResponse.json(
      { error: "Either 'descriptor' (number[]) or 'imageData' (base64) is required" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[/api/face-trace/trace]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
