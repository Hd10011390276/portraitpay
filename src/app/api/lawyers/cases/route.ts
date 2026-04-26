/**
 * GET /api/lawyers/cases - Get cases assigned to the logged-in lawyer
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/request-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get lawyer's registration to verify they're approved
    const lawyer = await prisma.lawyerRegistration.findFirst({
      where: {
        contactEmail: session.email,
        status: "APPROVED",
      },
    });

    if (!lawyer) {
      return NextResponse.json({ success: false, error: "Not an approved lawyer" }, { status: 403 });
    }

    // TODO: Get cases assigned to this lawyer
    // For now return empty array - cases would come from InfringementReport or similar
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (err) {
    console.error("[/api/lawyers/cases GET]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
