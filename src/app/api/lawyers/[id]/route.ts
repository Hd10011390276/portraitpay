/**
 * GET /api/lawyers/[id] — Get public lawyer profile by ID
 * Public endpoint (no auth required)
 * Returns only APPROVED lawyers
 * Exposes: companyName, lawyerType, country, contactName, contactEmail,
 *          contactPhone, createdAt, totalCases, wonCases
 * Does NOT expose: licenseUrl, status (admin-only fields)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const lawyer = await prisma.lawyerRegistration.findFirst({
      where: {
        id,
        status: "APPROVED",
      },
      include: {
        lawyerCases: {
          where: { status: { in: ["WON", "IN_PROGRESS", "PENDING", "CLOSED", "REJECTED"] } },
          select: { id: true, status: true },
        },
      },
    });

    if (!lawyer) {
      return NextResponse.json(
        { success: false, error: "Lawyer not found" },
        { status: 404 }
      );
    }

    const totalCases = lawyer.lawyerCases.length;
    const wonCases = lawyer.lawyerCases.filter((c: { status: string }) => c.status === "WON").length;

    return NextResponse.json({
      success: true,
      data: {
        id: lawyer.id,
        userId: lawyer.userId,
        companyName: lawyer.companyName,
        lawyerType: lawyer.lawyerType,
        country: lawyer.region,
        contactName: lawyer.contactName,
        contactEmail: lawyer.contactEmail,
        contactPhone: lawyer.contactPhone,
        createdAt: lawyer.createdAt,
        totalCases,
        wonCases,
      },
    });
  } catch (err) {
    console.error("[GET /api/lawyers/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lawyer" },
      { status: 500 }
    );
  }
}