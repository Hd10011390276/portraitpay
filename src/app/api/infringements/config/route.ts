/**
 * Infringement Monitor Config API
 *
 * GET  /api/infringements/config       — Get current user's monitor config
 * PUT  /api/infringements/config       — Create or update monitor config
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";

const MonitorConfigSchema = z.object({
  enabled: z.boolean().default(true),
  similarityThreshold: z.number().min(0.5).max(1.0).default(0.85),
  enabledPlatforms: z.array(z.string()).default([]),
  excludedPlatforms: z.array(z.string()).default([]),
  notifyEmail: z.boolean().default(true),
  notifySms: z.boolean().default(false),
  notifyWechat: z.boolean().default(false),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  highPriorityMuteExempt: z.boolean().default(true),
  scanIntervalHours: z.number().min(1).max(24).default(1),
});

// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.infringementMonitorConfig.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("[GET /api/infringements/config]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = MonitorConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const config = await prisma.infringementMonitorConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...parsed.data,
      },
      update: parsed.data,
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("[PUT /api/infringements/config]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
