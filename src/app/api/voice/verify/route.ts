/**
 * POST /api/voice/verify
 * Compare a new recording against the stored embedding.
 * Body: FormData with "file" (audio blob)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

const VOICE_SERVICE_URL = "https://hd10011390276--portraitpay-voice-final-web.modal.run";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.voiceEmbedding.findUnique({
    where: { userId: session.userId },
  });

  if (!record || record.embedding.length === 0) {
    return NextResponse.json(
      { success: false, message: "No voice embedding found. Please register first." },
      { status: 404 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, message: "No audio file provided" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || "audio/wav" });

    const form = new FormData();
    form.append("file", blob, file.name || "verify.wav");

    const voiceResp = await fetch(`${VOICE_SERVICE_URL}/embed`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(60_000),
    });

    if (!voiceResp.ok) {
      return NextResponse.json(
        { success: false, message: "Could not process audio. Try a clearer recording." },
        { status: 502 }
      );
    }

    const { embedding, duration } = await voiceResp.json() as {
      embedding: number[];
      duration: number;
    };

    // Verify against stored embedding via Python service
    const verifyForm = new FormData();
    // We need to pass both embeddings. Since the service takes files, we'll use
    // a direct cosine similarity calculation here (same math as the service).
    // The Python service /verify endpoint takes two audio files and computes cosine sim.
    // We already have the stored embedding, so compute similarity directly.
    const storedEmb = record.embedding;
    const newEmb = embedding;

    // Cosine similarity
    const dot = storedEmb.reduce((s, v, i) => s + v * newEmb[i], 0);
    const normStored = Math.sqrt(storedEmb.reduce((s, v) => s + v * v, 0));
    const normNew = Math.sqrt(newEmb.reduce((s, v) => s + v * v, 0));
    const similarity = dot / (normStored * normNew + 1e-8);

    const THRESHOLD = 0.80;
    const samePerson = similarity > THRESHOLD;

    return NextResponse.json({
      success: true,
      data: {
        similarity: Math.round(similarity * 10000) / 10000,
        samePerson,
        threshold: THRESHOLD,
        duration,
        hasEmbedding: true,
      },
    });
  } catch (err) {
    Sentry.captureException(err, {
      extra: { route: "/api/voice/verify", userId: session?.userId },
    });
    console.error("[voice/verify]", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}