import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "@/lib/auth/edge-jwt";

export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("pp_access_token")?.value ||
    cookieStore.get("accessToken")?.value ||
    null;
  if (!token) return null;
  try {
    const payload = await verifyToken(token) as JwtPayload | null;
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  // Static response — no DB call needed
  return NextResponse.json({ success: true, data: { count: 0 } });
}