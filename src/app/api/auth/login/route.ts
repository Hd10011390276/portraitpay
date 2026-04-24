
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { EmailLoginSchema } from "@/lib/auth/schemas";
import { signTokenPair } from "@/lib/auth/jwt";
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
          message: "表单验证失败",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, message: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip") ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      // Log failed login attempt
      await logAudit({
        userId: user.id,
        action: "LOGIN_FAILED",
        success: false,
        detail: "密码错误导致登录失败",
        meta: { ip, userAgent, errorCode: "INVALID_PASSWORD" },
      });
      return NextResponse.json(
        { success: false, message: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const tokens = signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log successful login
    await logAudit({
      userId: user.id,
      action: "LOGIN",
      success: true,
      detail: "邮箱密码登录成功",
      meta: { ip, userAgent },
    });

    const response = NextResponse.json({
      success: true,
      message: "登录成功",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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
      { success: false, message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
