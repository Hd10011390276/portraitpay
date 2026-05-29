/**
 * GET /api/lawyers — List approved lawyers for user dashboard display
 * Query params: ?country=US (optional filter)
 * Authenticated: returns full lawyer data (including email/phone/case counts)
 * Unauthenticated: returns only public fields (name, firm, jurisdiction, bar number, specialization)
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const isAuthenticated = !!session?.userId;

    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country"); // optional filter by country code

    const where: Record<string, unknown> = {
      status: "APPROVED",
    };

    if (country) {
      where.region = country;
    }

    const lawyers = await prisma.lawyerRegistration.findMany({
      where: {
        ...where,
        user: {
          email: {
            not: { contains: "test" },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        lawyerCases: {
          where: { status: { in: ["WON", "IN_PROGRESS", "PENDING", "CLOSED", "REJECTED"] } },
          select: { id: true, status: true },
        },
      },
    });

    if (isAuthenticated) {
      // Authenticated: return full data
      const mapped = lawyers.map((l) => {
        const totalCases = l.lawyerCases.length;
        const wonCases = l.lawyerCases.filter((c: { status: string }) => c.status === "WON").length;
        return {
          id: l.id,
          userId: l.userId,
          companyName: l.companyName,
          lawyerType: l.lawyerType,
          country: l.region,
          contactName: l.contactName,
          contactEmail: l.contactEmail,
          contactPhone: l.contactPhone,
          licenseUrl: l.licenseUrl,
          createdAt: l.createdAt,
          totalCases,
          wonCases,
        };
      });
      return NextResponse.json({ success: true, data: mapped });
    } else {
      // Unauthenticated: return only public safe fields — no email, phone, or case count
      const publicFields = lawyers.map((l) => ({
        id: l.id,
        companyName: l.companyName,
        lawyerType: l.lawyerType,
        country: l.region,
        contactName: l.contactName,
        licenseUrl: l.licenseUrl,
        createdAt: l.createdAt,
      }));
      return NextResponse.json({ success: true, data: publicFields });
    }
  } catch (err) {
    console.error("[GET /api/lawyers]", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
