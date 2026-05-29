import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { signTokenPair } from "@/lib/auth/edge-jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["USER", "AGENCY", "LAWYER"];

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { role } = body;

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate user has the requested account type
  if (role === "AGENCY") {
    const agencyAccount = await prisma.agencyAccount.findUnique({ where: { userId: session.userId } });
    if (!agencyAccount) {
      return NextResponse.json(
        { success: false, error: "No agency account found. Register as a creator first.", code: "NO_AGENCY_ACCOUNT" },
        { status: 403 }
      );
    }
  } else if (role === "LAWYER") {
    const lawyerReg = await prisma.lawyerRegistration.findFirst({
      where: { userId: session.userId, status: "APPROVED" },
    });
    if (!lawyerReg) {
      return NextResponse.json(
        { success: false, error: "No approved lawyer registration found.", code: "NO_LAWYER_REGISTRATION" },
        { status: 403 }
      );
    }
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // Issue new tokens with the switched role
  const tokens = await signTokenPair({
    userId: user.id,
    email: user.email,
    role,
  });

  const response = NextResponse.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });

  response.cookies.set("pp_access_token", tokens.accessToken, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 120,
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set("pp_refresh_token", tokens.refreshToken, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
