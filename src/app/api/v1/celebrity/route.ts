/**
 * POST   /api/v1/celebrity           — 提交艺人申请
 * GET    /api/v1/celebrity           — 查询申请状态（当前用户）
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

const CelebrityIntakeSchema = z.object({
  name: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email format"),
  contactPhone: z.string().max(30).optional(),
  stageName: z.string().min(1, "Stage name is required").max(200),
  category: z.string().min(1, "Please select a category").max(50),
  socialMedia: z.string().max(1000).optional(),
  agency: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
});

// ─── POST — 提交艺人申请 ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = CelebrityIntakeSchema.parse(body);

    const existing = await prisma.celebrityIntake.findFirst({
      where: {
        email: data.email,
        status: { in: ["PENDING", "REVIEWING"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An application is already pending for this email" },
        { status: 409 }
      );
    }

    const intake = await prisma.celebrityIntake.create({
      data: {
        name: data.name,
        email: data.email,
        contactPhone: data.contactPhone ?? null,
        stageName: data.stageName,
        category: data.category,
        socialMedia: data.socialMedia ?? null,
        agency: data.agency ?? null,
        message: data.message ?? null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: intake.id,
        message: "Application submitted. We will review within 3-5 business days",
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]?.message ?? "Invalid data format";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }
    console.error("[/api/v1/celebrity POST]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET — 查询当前用户的申请状态 ──────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const intake = await prisma.celebrityIntake.findFirst({
      where: { email: session.email ?? "" },
      orderBy: { createdAt: "desc" },
    });

    if (!intake) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: intake });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Query failed" }, { status: 500 });
  }
}
