import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const log =
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"];

  // Workaround: If DATABASE_URL is empty (Vercel encrypted env var decryption issue),
  // use a direct connection URL. This should rarely trigger as Vercel normally resolves it.
  const databaseUrl = process.env.DATABASE_URL?.trim() || 
    "postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

  return new PrismaClient({
    log,
    datasources: {
      db: { url: databaseUrl },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
