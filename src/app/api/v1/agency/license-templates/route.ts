/**
 * GET /api/v1/agency/license-templates — list templates for current agency
 * POST /api/v1/agency/license-templates — create a new license template
 *
 * Note: LicenseTemplate data is stored via LicensePackage (PortraitSettings)
 * or Portrait.aiLicenseFee/aiTerritorialScope. This API surface provides
 * a template CRUD for the IP Owner Portal UI.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // In a full implementation, templates would be stored as LicensePackage records.
    // For now return empty list — UI shows hardcoded sample templates.
    return NextResponse.json({ success: true, templates: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch templates";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, basePrice, royaltyPercent, territory, minGuarantee, currency } = body;

    if (!title || basePrice === undefined || royaltyPercent === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // In a full implementation, create a LicensePackage record here.
    // For now, generate a mock ID so the UI can update optimistically.
    const id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      id,
      template: { id, title, basePrice, royaltyPercent, territory, minGuarantee, currency },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create template";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}