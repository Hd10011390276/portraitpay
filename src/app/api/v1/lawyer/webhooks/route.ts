import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = (req.headers.get("Authorization") || "").slice(7);
  const { verifyApiKey } = await import("@/lib/auth/apiKeys");
  const { prisma } = await import("@/lib/prisma");
  const auth = await verifyApiKey(token);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const hooks = await prisma.webhookConfig.findMany({
    where: { userId: auth.userId },
    select: { id: true, url: true, events: true, isActive: true, secretPrefix: true, lastSentAt: true, lastStatus: true, failCount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: hooks });
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get("Authorization") || "").slice(7);
  const { verifyApiKey, generateWebhookSecret } = await import("@/lib/auth/apiKeys");
  const { prisma } = await import("@/lib/prisma");
  const auth = await verifyApiKey(token);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const body = await req.json();
  const { url, events } = body;
  if (!url || !events || !Array.isArray(events)) return NextResponse.json({ error: "url and events required" }, { status: 400 });
  const { rawSecret } = generateWebhookSecret();
  const hook = await prisma.webhookConfig.create({
    data: { userId: auth.userId, url, events, secret: rawSecret, secretPrefix: "pp_wh_" + rawSecret.slice(0, 8) },
    select: { id: true, url: true, events: true, secretPrefix: true },
  });
  return NextResponse.json({ success: true, data: { ...hook, secret: rawSecret } }, { status: 201 });
}