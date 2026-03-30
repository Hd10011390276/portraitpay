/**
 * PATCH /api/v1/admin/enterprise/:id/review
 * 审核企业资质
 */
import { NextRequest, NextResponse } from "next/server";
import { reviewEnterprise } from "@/lib/enterprise/service";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ success: false, error: "无效的审核动作" }, { status: 400 });
    }

    if (action === "REJECT" && !rejectionReason) {
      return NextResponse.json({ success: false, error: "请填写拒绝原因" }, { status: 400 });
    }

    const result = await reviewEnterprise(
      params.id,
      session.userId,
      action,
      rejectionReason
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "审核失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
