/**
 * POST /api/v1/agent/members/[id]/voice/register
 * Upload voice sample for a member, generate embedding, store in DB.
 * Body: FormData with "file" (audio/wav or audio/mp3 etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

const VOICE_SERVICE_URL = "https://hd10011390276--portraitpay-voice-final-web.modal.run";

const MIN_DURATION = 2;
const MAX_DURATION = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agency = await authenticateRequest(req);
    if (!agency) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agencyAccount = await prisma.agencyAccount.findUnique({ where: { userId: agency.userId } });
    if (!agencyAccount) {
      return NextResponse.json({ success: false, error: "Not an agent" }, { status: 403 });
    }

    const member = await prisma.iPMember.findUnique({ where: { id: params.id } });
    if (!member || member.agencyId !== agencyAccount.id) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    if (!member.userId) {
      return NextResponse.json(
        { success: false, error: "Member has no linked PortraitPay account" },
        { status: 400 }
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

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || "audio/wav" });

    const voiceForm = new FormData();
    voiceForm.append("file", blob, file.name || "voice.wav");

    const voiceResp = await fetch(`${VOICE_SERVICE_URL}/embed`, {
      method: "POST",
      body: voiceForm,
      signal: AbortSignal.timeout(60_000),
    });

    if (!voiceResp.ok) {
      const errText = await voiceResp.text();
      console.error("[POST /api/v1/agent/members/[id]/voice/register] voice service error:", errText);
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

    const record = await prisma.voiceEmbedding.upsert({
      where: { userId: member.userId },
      update: { embedding, duration, sampleUrl: null },
      create: {
        userId: member.userId,
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
    console.error("[POST /api/v1/agent/members/[id]/voice/register]", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}