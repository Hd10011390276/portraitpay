/**
 * DELETE /api/v1/agency/artist/:id
 * 移除代理艺人
 */
import { NextRequest, NextResponse } from "next/server";
import { removeArtistFromAgency } from "@/lib/enterprise/agencyService";
import { getEnterpriseProfile } from "@/lib/enterprise/service";
import { getSession } from "@/lib/auth/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const enterprise = await getEnterpriseProfile(session.userId);
    if (!enterprise?.isAgency) throw new Error("您不是经纪公司");

    const result = await removeArtistFromAgency(params.id);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "移除失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
