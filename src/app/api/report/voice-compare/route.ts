/**
 * POST /api/report/voice-compare
 * Accepts an audio file, compares against the reporter's registered voice embedding.
 * Returns similarity score and risk level.
 *
 * Input:  FormData with "file" (audio blob)
 * Output: { success, similarity, risk, duration }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VOICE_SERVICE_URL = "https://hd10011390276--portraitpay-voice-final-web.modal.run";

function riskLevel(score: number): string {
  if (score >= 0.75) return "HIGH";
  if (score >= 0.55) return "MEDIUM";
  return "LOW";
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Find reporter's registered voice embedding
  const voiceRecord = await prisma.voiceEmbedding.findUnique({
    where: { userId: session.userId },
  });

  if (!voiceRecord || voiceRecord.embedding.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "No voice fingerprint registered. Go to Dashboard → Voice ID to register first.",
        code: "NO_VOICE_REGISTERED",
      },
      { status: 409 }
    );
  }

  // Parse FormData
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

    // Step 1: Get embedding of submitted audio via Python service
    const embedForm = new FormData();
    embedForm.append("file", blob, file.name || "suspect.webm");

    const embedResp = await fetch(`${VOICE_SERVICE_URL}/embed`, {
      method: "POST",
      body: embedForm,
      signal: AbortSignal.timeout(60_000),
    });

    if (!embedResp.ok) {
      return NextResponse.json(
        { success: false, message: "Could not process audio. Try a clearer or longer recording (2-60s)." },
        { status: 422 }
      );
    }

    const { embedding: suspectEmbedding, duration } = await embedResp.json() as {
      embedding: number[];
      duration: number;
    };

    if (duration < 2) {
      return NextResponse.json(
        { success: false, message: `Recording too short (${duration}s). Need at least 2 seconds.` },
        { status: 422 }
      );
    }

    // Step 2: Cosine similarity against registered embedding
    const registeredEmbedding = voiceRecord.embedding;

    let dot = 0;
    for (let i = 0; i < registeredEmbedding.length; i++) {
      dot += registeredEmbedding[i] * suspectEmbedding[i];
    }
    const normReg = Math.sqrt(registeredEmbedding.reduce((s, v) => s + v * v, 0));
    const normSus = Math.sqrt(suspectEmbedding.reduce((s, v) => s + v * v, 0));
    const similarity = dot / (normReg * normSus + 1e-8);
    const risk = riskLevel(similarity);

    return NextResponse.json({
      success: true,
      data: {
        similarity: Math.round(similarity * 10000) / 10000,
        risk,
        duration: Math.round(duration * 100) / 100,
        hasEmbedding: true,
      },
    });
  } catch (err) {
    console.error("[voice-compare]", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}