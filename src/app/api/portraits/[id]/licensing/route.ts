import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { Portrait, PortraitSettings } = await import("@/lib/prisma");
    const session = await import("@/lib/auth").then(m => m.auth());

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const portrait = await Portrait.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    const settings = await PortraitSettings.findUnique({
      where: { userId: session.user.id },
    });

    const defaults = {
      allowLicensing: settings?.allowLicensing ?? true,
      defaultLicenseFee: settings?.defaultLicenseFee ? String(settings.defaultLicenseFee) : "0",
      allowedScopes: settings?.allowedScopes ?? [],
      prohibitedContent: settings?.prohibitedContent ?? [],
      defaultTerritorialScope: settings?.defaultTerritorialScope ?? "global",
    };

    return NextResponse.json({
      success: true,
      data: {
        allowAiLicensing: null,
        aiLicenseFee: null,
        aiLicenseScopes: [],
        aiProhibitedScopes: [],
        aiTerritorialScope: "global",
        defaults,
      },
    });
  } catch (err) {
    console.error("[portraits/licensing GET]", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}