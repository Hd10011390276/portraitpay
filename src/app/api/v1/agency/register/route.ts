import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: { agencyName?: string; agencyType?: string; country?: string; contactName?: string; contactEmail?: string; registrationNo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { agencyName, agencyType, country, contactName, contactEmail, registrationNo } = body;

  if (!agencyName || !agencyType || !country || !contactName || !contactEmail) {
    return NextResponse.json(
      { success: false, error: "agencyName, agencyType, country, contactName, and contactEmail are required" },
      { status: 400 }
    );
  }

  // Validate agencyType
  const validTypes = ["ROOT_SPONSOR", "ENTERTAINMENT_AGENCY", "ESTATE"];
  if (!validTypes.includes(agencyType)) {
    return NextResponse.json(
      { success: false, error: `Invalid agencyType. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // 3. Check existing agency account
  const existing = await prisma.agencyAccount.findUnique({
    where: { userId: session.userId },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Agency account already exists" },
      { status: 400 }
    );
  }

  // 4. Get user info
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { displayName: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // 5. Map country to jurisdiction string
  const jurisdictionMap: Record<string, string> = {
    CN: "China",
    US: "United States",
    GB: "United Kingdom",
    JP: "Japan",
    KR: "South Korea",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    SG: "Singapore",
    HK: "Hong Kong",
  };
  const jurisdiction = jurisdictionMap[country] ?? country;

  // 6. Create AgencyAccount
  const agency = await prisma.agencyAccount.create({
    data: {
      userId: session.userId,
      agencyName: agencyName.trim(),
      agencyType,
      jurisdiction,
      contactName,
      contactEmail,
      registrationNo: registrationNo || null,
      tier: "BRONZE",
      status: "PENDING",
    },
  });

  // 8. Auto-create AgencyEscrow
  await prisma.agencyEscrow.create({
    data: {
      agencyId: agency.id,
      currency: "USD",
      status: "ACTIVE",
    },
  });

  // 9. Update user role to AGENCY
  await prisma.user.update({
    where: { id: session.userId },
    data: { role: "AGENCY" },
  });

  return NextResponse.json({ success: true, agency });
}