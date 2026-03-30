/**
 * GET /api/v1/authorizations/enterprise/:id/certificate
 * 下载授权证书 PDF
 */
import { NextRequest, NextResponse } from "next/server";
import { getCertificatePDF } from "@/lib/enterprise/certificate";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 查找该 application 对应的企业是否属于当前用户
    const application = await prisma.entAuthApplication.findUnique({
      where: { id: params.id },
      include: { portrait: true },
    });
    if (!application) {
      return NextResponse.json({ success: false, error: "申请不存在" }, { status: 404 });
    }

    const enterprise = await prisma.enterprise.findUnique({
      where: { id: application.enterpriseId },
    });
    if (!enterprise || enterprise.userId !== session.userId) {
      return NextResponse.json({ success: false, error: "无权访问此证书" }, { status: 403 });
    }

    const cert = await getCertificatePDF(params.id);

    // 返回证书信息（实际 PDF URL 用于前端下载）
    return NextResponse.json({
      success: true,
      data: {
        certificateNo: cert.certificateNo,
        pdfUrl: cert.pdfUrl,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        blockchainTxHash: cert.blockchainTxHash,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取证书失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
