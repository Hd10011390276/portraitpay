import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/edge-jwt";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/terms",
  "/privacy",
  "/contact",
  "/celebrity",
  "/enterprise",
  "/enterprise/authorization/apply",
  "/enterprise/lawyer-registration",
  "/contracts",
  "/faq",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public pages (exact match for "/" + prefix match for others)
  if (pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow auth API routes
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/otp/") ||
    pathname.startsWith("/api/auth/forgot-password") ||
    pathname.startsWith("/api/auth/verify-email") ||
    pathname.startsWith("/api/auth/refresh") ||
    pathname.startsWith("/api/lawyers/apply") ||
    pathname.startsWith("/api/face/compare") ||
    (pathname.startsWith("/api/lawyers") && req.method === "GET")
  ) {
    return NextResponse.next();
  }

  // Check JWT token — support both cookie and Authorization header
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken =
    req.cookies.get("pp_access_token")?.value ||
    req.cookies.get("accessToken")?.value;
  const token = bearerToken || cookieToken;

  if (!token || !(await verifyToken(token))) {
    // API routes require authentication - return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "未授权，请先登录" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
