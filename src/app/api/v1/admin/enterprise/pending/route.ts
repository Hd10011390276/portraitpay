
/**
 * GET /api/v1/admin/enterprise/pending
 * 列出所有待审核企业
 */
import { NextRequest, NextResponse } from "next/server";
import { listPendingEnterprises } from "@/lib/enterprise/service";
import { getSession, getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN" && session.role !== "VERIFIER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const result = await listPendingEnterprises(page, limit);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "获取列表失败" }, { status: 500 });
  }
}
