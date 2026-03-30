import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "./jwt";

const ACCESS_TOKEN_COOKIE = "pp_access_token";
const REFRESH_TOKEN_COOKIE = "pp_refresh_token";

export interface SessionUser {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ||
    cookieStore.get("accessToken")?.value;

  if (!accessToken) return null;

  const payload: JwtPayload | null = verifyToken(accessToken);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  };
}

export function setTokenCookies(
  accessToken: string,
  refreshToken: string
): {
  accessToken: string;
  refreshToken: string;
  accessTokenCookie: string;
  refreshTokenCookie: string;
} {
  return {
    accessToken,
    refreshToken,
    accessTokenCookie: ACCESS_TOKEN_COOKIE,
    refreshTokenCookie: REFRESH_TOKEN_COOKIE,
  };
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
