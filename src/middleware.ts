import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/edge-jwt";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/contact",
  "/enterprise/authorization/apply",
  "/enterprise/lawyer-registration",
  "/enterprise/certification",
  "/contracts",
  "/faq",
  "/report-public",
  "/verify",
  "/consent-passport",
  "/verify-batch",
  "/lawyers",
  "/lawyer/apply",
  "/infringement-report",
  "/report",
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
    pathname.startsWith("/api/auth/reset-password") ||
    pathname.startsWith("/api/auth/verify-email") ||
    pathname.startsWith("/api/auth/refresh") ||
    pathname.startsWith("/api/lawyers/apply") ||
    pathname.startsWith("/api/face/compare") ||
    pathname.startsWith("/api/face-trace") ||
    pathname.startsWith("/api/stats") ||
    pathname.startsWith("/api/public-report") ||
    pathname.startsWith("/api/portraits/") && pathname.includes("/mint") ||
    (pathname.startsWith("/api/lawyers") && req.method === "GET") ||
    pathname.startsWith("/api/consent-passport") ||
    (pathname.startsWith("/api/report/") && !pathname.endsWith("/submit"))
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
      return NextResponse.json({ success: false, message: "Unauthorized — please sign in first" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin route protection ─────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const jwtPayload = await verifyToken(token!);
    const userRole = jwtPayload?.role ?? "";
    // Dev test accounts bypass role check — can access all dashboards
    const testEmails = ["799096322@qq.com", "admin@portraitpay.ai"];
    const isTestAccount = testEmails.includes(jwtPayload?.email ?? "");
    if (!isTestAccount && !adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // ── Lawyer route protection ───────────────────────────────────
  if (pathname.startsWith("/lawyer")) {
    const jwtPayload = await verifyToken(token!);
    const userRole = jwtPayload?.role ?? "";
    // Dev test accounts bypass role check
    const testEmails = ["799096322@qq.com", "admin@portraitpay.ai"];
    const isTestAccount = testEmails.includes(jwtPayload?.email ?? "");
    if (!isTestAccount && userRole !== "LAWYER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const runtime = "nodejs";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
