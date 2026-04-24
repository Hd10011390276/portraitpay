/**
 * Edge-compatible JWT utilities using jose
 * Use this in middleware and Edge runtime code
 */

import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "portraitpay-dev-secret-change-in-prod"
);

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function signTokenPair(payload: Omit<JwtPayload, "iat" | "exp">): Promise<TokenPair> {
  return {
    accessToken: await signAccessToken(payload),
    refreshToken: await signRefreshToken(payload),
  };
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// Re-export types for convenience
export type { JwtPayload as EdgeJwtPayload, TokenPair as EdgeTokenPair };
