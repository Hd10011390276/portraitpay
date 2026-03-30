import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signTokenPair } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    let refreshToken: string | undefined;

    // Try body first, then cookie
    try {
      const body = await req.json().catch(() => ({}));
      refreshToken = body?.refreshToken;
    } catch {
      // no body
    }

    if (!refreshToken) {
      refreshToken = req.cookies.get("pp_refresh_token")?.value;
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "无刷新令牌" },
        { status: 401 }
      );
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "令牌无效" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "用户不存在" },
        { status: 401 }
      );
    }

    const tokens = signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      data: {
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
    console.error("[REFRESH_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
