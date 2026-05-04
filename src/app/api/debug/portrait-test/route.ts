import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  
  let userId = request.nextUrl.searchParams.get("userId");
  
  if (!session?.userId && !userId) {
    return NextResponse.json({ 
      success: false, 
      error: "No session and no userId",
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 401 });
  }

  if (!userId && session?.userId) userId = session.userId;

  try {
    // Try to count portraits - this tests DB connection and permissions
    const count = await prisma.portrait.count({ where: { ownerId: userId } });
    
    // Try to create a test portrait with a unique title
    const testTitle = `DEBUG-${Date.now()}`;
    const testPortrait = await prisma.portrait.create({
      data: {
        title: testTitle,
        category: "general",
        ownerId: userId!,
        status: "DRAFT",
        faceEmbedding: [],
      },
    });
    
    // Clean up
    await prisma.portrait.delete({ where: { id: testPortrait.id } });

    return NextResponse.json({
      success: true,
      debug: true,
      session: session ? { userId: session.userId, email: session.email } : null,
      dbConnection: "OK",
      portraitCount: count,
      testCreate: "OK",
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      code: err.code,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
      }
    }, { status: 500 });
  }
}