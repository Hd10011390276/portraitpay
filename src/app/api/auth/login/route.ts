import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { EmailLoginSchema } from "@/lib/auth/schemas";
import { signTokenPair } from "@/lib/auth/edge-jwt";
import { logAudit } from "@/lib/audit/service";
export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  try {
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

    const { email, password } = parsed.data;

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

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip") ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await logAudit({
        userId: user.id,
        action: "LOGIN_FAILED",
        success: false,
        detail: "Wrong password",
        meta: { ip, userAgent, errorCode: "INVALID_PASSWORD" },
      });
      return NextResponse.json(
        { success: false, message: "Email or password incorrect" },
        { status: 401 }
      );
    }

    await logAudit({
      userId: user.id,
      action: "LOGIN",
      success: true,
      detail: "Email login successful",
      meta: { ip, userAgent },
    });

    const tokens = await signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const redirectTo =
      user.role === "LAWYER"
        ? "/lawyer/dashboard"
        : user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "VERIFIER"
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
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        redirectTo,
      },
    });

    response.cookies.set(
      "pp_access_token",
      tokens.accessToken,
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 15, secure: process.env.NODE_ENV === "production" }
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