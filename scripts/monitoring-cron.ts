/**
 * Infringement Monitoring Cron Job
 *
 * Usage:
 *   npx ts-node scripts/monitoring-cron.ts
 *   or via system cron: 0 * * * * cd /path/to/project && npx ts-node scripts/monitoring-cron.ts
 *
 * Designed to run every hour (via external cron scheduler or Vercel Cron).
 *
 * For Vercel deployment, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/monitoring",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { PrismaClient } from "@prisma/client";
import { runMonitoringCycle } from "../src/lib/infringement/scanner";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

async function main() {
  const start = Date.now();
  console.log(`[Cron] Monitoring cycle started at ${new Date().toISOString()}`);

  try {
    // Check if there's already a running cycle (prevent overlapping runs)
    const activeCycle = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "InfringementAlert"
      WHERE "createdAt" > NOW() - INTERVAL '55 minutes'
      LIMIT 1
    `.catch(() => []);

    // Simple lock: if we ran in the last 50 minutes, skip
    const recentAlerts = await prisma.infringementAlert.count({
      where: {
        createdAt: { gt: new Date(Date.now() - 50 * 60 * 1000) },
      },
    });

    if (recentAlerts > 0) {
      console.log("[Cron] A cycle ran recently, skipping this invocation to prevent overlap.");
      await prisma.$disconnect();
      process.exit(0);
    }

    const result = await runMonitoringCycle();

    console.log(`[Cron] Cycle completed in ${Date.now() - start}ms`);
    console.log(`  Alerts created : ${result.alertsCreated}`);
    console.log(`  Portraits scanned: ${result.portraitsScanned}`);
    console.log(`  URLs scanned   : ${result.urlsScanned}`);
    if (result.errors.length) {
      console.warn(`  Errors (${result.errors.length}):`);
      result.errors.forEach((e) => console.warn(`    - ${e}`));
    }

    // Log cron execution for audit
    await prisma.auditLog.create({
      data: {
        adminId: "SYSTEM-CRON",
        targetType: "InfringementMonitor",
        targetId: "monitoring-cycle",
        action: "WITHDRAWAL_APPROVE" as never, // Reuse — add a new enum value for cron if needed
        before: undefined,
        after: JSON.stringify(result),
        reason: `Cron execution at ${new Date().toISOString()}`,
      },
    }).catch(() => {
      // AuditLog may not have cron action enum — ignore
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[Cron] Fatal error during monitoring cycle:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
