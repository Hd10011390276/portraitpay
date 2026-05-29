import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export function generateApiKey(): { rawKey: string; keyHash: string; prefix: string } {
  const rawKey = `pp_live_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 15) + "...";
  return { rawKey, keyHash, prefix };
}

export function generateWebhookSecret(): { rawSecret: string; hash: string } {
  const rawSecret = crypto.randomBytes(24).toString("hex");
  return { rawSecret, hash: crypto.createHash("sha256").update(rawSecret).digest("hex") };
}

export async function verifyApiKey(token: string): Promise<{
  userId: string;
  scopes: string[];
} | null> {
  if (!token || !token.startsWith("pp_live_")) return null;
  const keyHash = crypto.createHash("sha256").update(token).digest("hex");
  const key = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { userId: true, scopes: true, status: true, revokedAt: true, expiresAt: true },
  });
  if (!key || key.status !== "ACTIVE" || key.revokedAt) return null;
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return null;
  return { userId: key.userId, scopes: key.scopes as string[] };
}

// Try API key first (pp_live_ prefix), then session cookie fallback
export async function authenticateRequest(req: {
  headers: { get(name: string): string | null };
  cookies?: { get(name: string): { value: string } | undefined };
}): Promise<{ userId: string; scopes: string[] } | null> {
  const header = req.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  // API key path
  if (token.startsWith("pp_live_")) {
    return await verifyApiKey(token);
  }

  // Session cookie fallback — import dynamically to avoid edge runtime issues
  const { getSessionFromRequest } = await import("@/lib/auth/session");
  const session = await getSessionFromRequest(req as any);
  if (session?.userId) {
    return { userId: session.userId, scopes: ["*"] }; // wildcard = full access (session user)
  }

  return null;
}