import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./edge-jwt";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export interface SessionUser {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
  emailVerified: Date | null;
}

const ACCESS_TOKEN_COOKIE = "pp_access_token";
const REFRESH_TOKEN_COOKIE = "pp_refresh_token";

async function _verifySession(token: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  const payload: JwtPayload | null = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, image: true, emailVerified: true },
  });
  if (!user) return null;
  return { userId: user.id, email: user.email, name: user.name, role: user.role, image: user.image, emailVerified: user.emailVerified };
}

/**
 * Default getSession() — cookie-only fallback.
 * For API routes that need Bearer token support, use getSessionFromRequest(request) instead.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pp_access_token")?.value || cookieStore.get("accessToken")?.value || null;
  return _verifySession(token);
}

/**
 * Get session from a NextRequest — supports Bearer token + cookie.
 * Use this in API route handlers that receive a NextRequest.
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  // Priority 1: Authorization header Bearer token
  const authHeader = request.headers.get("Authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
  // Priority 2: cookies
  if (!token) {
    token = request.cookies.get("pp_access_token")?.value || request.cookies.get("accessToken")?.value || null;
  }
  return _verifySession(token);
}

export function setTokenCookies(accessToken: string, refreshToken: string) {
  return { accessToken, refreshToken, accessTokenCookie: ACCESS_TOKEN_COOKIE, refreshTokenCookie: REFRESH_TOKEN_COOKIE };
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
