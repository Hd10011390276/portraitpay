import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "已退出登录" });

  response.cookies.set("pp_access_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("pp_refresh_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
