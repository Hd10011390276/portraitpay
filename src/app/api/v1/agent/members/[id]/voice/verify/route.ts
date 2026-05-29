/**
 * POST /api/v1/agent/members/[id]/voice/verify
 * Upload voice sample for a member and verify against stored embedding.
 * Body: FormData with "file" (audio/wav or audio/mp3 etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

const VOICE_SERVICE_URL = "https://hd10011390276--portraitpay-voice-final-web.modal.run";

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
        { success: false, message: "Member has no linked PortraitPay account" },
        { status: 400 }
      );
    }

    const record = await prisma.voiceEmbedding.findUnique({
      where: { userId: member.userId },
    });

    if (!record || record.embedding.length === 0) {
      return NextResponse.json(
        { success: false, message: "No voice registered for this member" },
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

    const form = new FormData();
    form.append("file", blob, "verify.webm");
    form.append("embedding", JSON.stringify(record.embedding));

    const vResp = await fetch(`${VOICE_SERVICE_URL}/verify`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(60_000),
    });

    if (!vResp.ok) {
      const errText = await vResp.text();
      console.error("[POST /api/v1/agent/members/[id]/voice/verify] voice service error:", errText);
      return NextResponse.json(
        { success: false, message: "Voice verification failed. Try a clearer recording." },
        { status: 502 }
      );
    }

    const { similarity } = await vResp.json() as { similarity: number };

    return NextResponse.json({
      success: true,
      data: {
        similarity,
        samePerson: similarity >= 0.8,
      },
    });
  } catch (err) {
    console.error("[POST /api/v1/agent/members/[id]/voice/verify]", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}