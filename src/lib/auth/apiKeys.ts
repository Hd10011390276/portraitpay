import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateApiKey(): { rawKey: string; keyHash: string; prefix: string } {
  const rawKey = "pp_law_" + randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 14);
  return { rawKey, keyHash, prefix };
}

export async function verifyApiKey(rawKey: string) {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const key = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { id: true, email: true, name: true, role: true, image: true, emailVerified: true } } },
  });
  if (!key || key.revokedAt) return null;
  await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return { userId: key.user.id, email: key.user.email, name: key.user.name, role: key.user.role, image: key.user.image, emailVerified: key.user.emailVerified };
}
