/**
 * GET /api/debug/db-check — Check if Portrait table has idCardFrontUrl column
 * This is a public diagnostic endpoint.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test 1: Can we query Portrait with idCardFrontUrl?
    const result = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Portrait' AND column_name = 'idCardFrontUrl'
    ` as any[];

    const hasColumn = result.length > 0;

    // Test 2: Can we do a simple Prisma query?
    const count = await prisma.portrait.count();

    // Test 3: Can we upload a tiny test file to R2?
    let storageWorking = false;
    let storageError = "";
    try {
      const testKey = `debug/test-${Date.now()}.txt`;
      await uploadFile(Buffer.from("test"), testKey, "text/plain");
      storageWorking = true;
    } catch (e) {
      storageError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      success: true,
      db: {
        hasIdCardFrontUrlColumn: hasColumn,
        portraitCount: count,
      },
      storage: {
        working: storageWorking,
        error: storageError || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}