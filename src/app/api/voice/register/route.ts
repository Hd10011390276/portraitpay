/**
 * POST /api/voice/register
 * Upload voice sample, generate embedding, store in DB.
 * Body: FormData with "file" (audio/wav or audio/mp3 etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VOICE_SERVICE_URL = "https://hd10011390276--portraitpay-voice-final-web.modal.run";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
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

  // Min duration 2s
  const MIN_DURATION = 2;
  const MAX_DURATION = 60;

  // Convert FormData to a Blob we can re-use
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type || "audio/wav" });

  try {
    // Call Python voice service
    const form = new FormData();
    form.append("file", blob, file.name || "voice.wav");

    const voiceResp = await fetch(`${VOICE_SERVICE_URL}/embed`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(60_000),
    });

    if (!voiceResp.ok) {
      const errText = await voiceResp.text();
      console.error("[voice/register] voice service error:", errText);
      return NextResponse.json(
        { success: false, message: "Voice embedding failed. Try a clearer recording." },
        { status: 502 }
      );
    }

    const { embedding, duration } = await voiceResp.json() as {
      embedding: number[];
      duration: number;
    };

    if (duration < MIN_DURATION) {
      return NextResponse.json(
        { success: false, message: `Recording too short (${duration}s). Need at least ${MIN_DURATION}s.` },
        { status: 400 }
      );
    }
    if (duration > MAX_DURATION) {
      return NextResponse.json(
        { success: false, message: `Recording too long (${duration}s). Max ${MAX_DURATION}s.` },
        { status: 400 }
      );
    }

    // Upsert embedding
    const record = await prisma.voiceEmbedding.upsert({
      where: { userId: session.userId },
      update: { embedding, duration, sampleUrl: null },
      create: {
        userId: session.userId,
        embedding,
        duration,
        sampleUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        duration: record.duration,
        dimensions: embedding.length,
        createdAt: record.createdAt,
      },
    });
  } catch (err) {
    console.error("[voice/register]", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}