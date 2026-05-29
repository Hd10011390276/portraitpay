import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/apiKeys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agency = await prisma.agencyAccount.findUnique({ where: { userId: auth.userId } });
  if (!agency) return NextResponse.json({ error: "Not an agent" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  const files = await prisma.memberDocument.findMany({
    where: { agencyId: agency.id, memberId: memberId || null },
    orderBy: { chainIndex: "asc" },
    select: {
      id: true, fileName: true, category: true, contentHash: true,
      previousHash: true, chainIndex: true, createdAt: true, tags: true,
    },
  });

  let integrity = "EMPTY";
  if (files.length > 0) {
    const valid = files.every((f, i) => {
      if (i === 0) return f.previousHash === null;
      return f.previousHash === files[i - 1].contentHash;
    });
    integrity = valid ? "VALID" : "BROKEN";
  }

  return NextResponse.json({
    success: true,
    data: { files, chainLength: files.length, integrity },
  });
}