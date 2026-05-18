/**
 * GET /api/marketplace/license-packages — list active packages
 * POST /api/marketplace/license-packages — create a package (owner only)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const VALID_SCOPES = [
  "FILM", "ANIMATION", "ADVERTISING", "GAMING", "PRINT",
  "MERCHANDISE", "SOCIAL_MEDIA", "EDUCATION", "NEWS",
];

const VALID_TERRITORIES = [
  "global", "china", "asia", "europe", "americas",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId");
  const portraitId = searchParams.get("portraitId");
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (ownerId) where.ownerId = ownerId;
  if (portraitId) where.portraitId = portraitId;
  if (active !== null) where.isActive = active === "true";

  const packages = await prisma.licensePackage.findMany({
    where,
    include: {
      portrait: { select: { id: true, title: true, thumbnailUrl: true } },
      owner: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: packages });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    portraitId,
    title,
    description,
    usageScope = ["FILM"],
    prohibitedUses = [],
    territory = "global",
    durationDays = 365,
    price,
    currency = "USD",
    isActive = true,
    requiresApproval = true,
  } = body;

  if (!portraitId) {
    return NextResponse.json({ success: false, error: "portraitId required" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ success: false, error: "title required" }, { status: 400 });
  }
  if (!price || price <= 0) {
    return NextResponse.json({ success: false, error: "price must be positive" }, { status: 400 });
  }

  const portrait = await prisma.portrait.findUnique({
    where: { id: portraitId },
    select: { id: true, ownerId: true, status: true },
  });
  if (!portrait) {
    return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
  }
  if (portrait.ownerId !== session.userId) {
    return NextResponse.json({ success: false, error: "Not your portrait" }, { status: 403 });
  }
  if (portrait.status !== "ACTIVE") {
    return NextResponse.json({ success: false, error: "Portrait is not active" }, { status: 400 });
  }

  const invalidScopes = usageScope.filter((s: string) => !VALID_SCOPES.includes(s));
  if (invalidScopes.length > 0) {
    return NextResponse.json(
      { success: false, error: `Invalid scopes: ${invalidScopes.join(", ")}` },
      { status: 400 }
    );
  }
  if (!VALID_TERRITORIES.includes(territory)) {
    return NextResponse.json({ success: false, error: "Invalid territory" }, { status: 400 });
  }
  if (durationDays < 1 || durationDays > 3650) {
    return NextResponse.json({ success: false, error: "durationDays must be 1-3650" }, { status: 400 });
  }

  const pkg = await prisma.licensePackage.create({
    data: {
      portraitId,
      ownerId: session.userId,
      title,
      description: description ?? null,
      usageScope,
      prohibitedUses,
      territory,
      durationDays,
      price,
      currency,
      isActive,
      requiresApproval,
    },
  });

  return NextResponse.json({ success: true, data: pkg }, { status: 201 });
}