import { NextRequest, NextResponse } from "next/server";
import { VerifyOtpSchema } from "@/lib/auth/schemas";
import { verifyOtp } from "@/lib/auth/otp";
import { signTokenPair } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);

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

    const { phone, code } = parsed.data;

    const valid = verifyOtp(phone, code);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "验证码错误或已过期" },
        { status: 401 }
      );
    }

    // Find or create user by phone
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // Auto-register with phone-only (no password set yet)
      user = await prisma.user.create({
        data: { phone, email: `${phone}@phone.local`, role: "USER" },
      });
    }

    const tokens = signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
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
    console.error("[OTP_VERIFY_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
