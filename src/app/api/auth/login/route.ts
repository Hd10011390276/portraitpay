import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { EmailLoginSchema } from "@/lib/auth/schemas";
import { signTokenPair } from "@/lib/auth/edge-jwt";
import { logAudit } from "@/lib/audit/service";
export const dynamic = "force-dynamic";

// In-memory rate limiter: 5 attempts per IP per minute
const loginRateLimitMap = new Map<string, { count: number; resetAt: number }>();


export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip") ?? "unknown";
    const now = Date.now();
    const limit = loginRateLimitMap.get(ip);
    if (limit && limit.count >= 5 && now < limit.resetAt) {
      return NextResponse.json({ success: false, error: "Too many login attempts. Try again later." }, { status: 429 });
    }
    if (!limit || now >= limit.resetAt) {
      loginRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    } else {
      limit.count++;
    }

    const body = await req.json();
    const parsed = EmailLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, loginAs } = parsed.data as { email: string; password: string; loginAs?: string };

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true, name: true, role: true, passwordHash: true, emailVerified: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Email or password incorrect" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, message: "Please verify your email first", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    const userAgent = req.headers.get("user-agent") ?? null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      // Fire-and-forget: never block login due to audit failure
      logAudit({
        userId: user.id,
        action: "LOGIN_FAILED",
        success: false,
        detail: "Wrong password",
        meta: { ip, userAgent, errorCode: "INVALID_PASSWORD" },
      }).catch((err) => console.error("[LOGIN_AUDIT_ERROR]", err));
      return NextResponse.json(
        { success: false, message: "Email or password incorrect" },
        { status: 401 }
      );
    }

    // Validate loginAs: check if user has the corresponding account type
    let effectiveRole = user.role;
    if (loginAs === "agency") {
      const agencyAccount = await prisma.agencyAccount.findUnique({ where: { userId: user.id } });
      if (agencyAccount) {
        effectiveRole = "AGENCY";
      } else {
        return NextResponse.json(
          { success: false, message: "No agency account found. Please register as a creator first.", code: "NO_AGENCY_ACCOUNT" },
          { status: 403 }
        );
      }
    } else if (loginAs === "lawyer") {
      const lawyerReg = await prisma.lawyerRegistration.findFirst({
        where: { userId: user.id, status: "APPROVED" },
      });
      if (lawyerReg) {
        effectiveRole = "LAWYER";
      } else {
        return NextResponse.json(
          { success: false, message: "No approved lawyer registration found. Please complete lawyer registration first.", code: "NO_LAWYER_REGISTRATION" },
          { status: 403 }
        );
      }
    }

    // Fire-and-forget: never block login due to audit failure
    logAudit({
      userId: user.id,
      action: "LOGIN",
      success: true,
      detail: `Email login successful (effectiveRole=${effectiveRole}, loginAs=${loginAs || "none"})`,
      meta: { ip, userAgent },
    }).catch((err) => console.error("[LOGIN_AUDIT_ERROR]", err));

    const tokens = await signTokenPair({
      userId: user.id,
      email: user.email,
      role: effectiveRole,
    });

    // Redirect based on effective role
    const redirectTo =
      effectiveRole === "LAWYER"
        ? "/lawyer/dashboard"
        : effectiveRole === "AGENCY"
        ? "/enterprise/dashboard"
        : effectiveRole === "SUPER_ADMIN" || effectiveRole === "ADMIN" || effectiveRole === "VERIFIER"
        ? "/admin"
        : "/dashboard";

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: effectiveRole,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        redirectTo,
      },
    });

    response.cookies.set(
      "pp_access_token",
      tokens.accessToken,
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 120, secure: process.env.NODE_ENV === "production" }
    );
    response.cookies.set(
      "pp_refresh_token",
      tokens.refreshToken,
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production" }
    );

    return response;
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Server error, please try again later" },
      { status: 500 }
    );
  }
}