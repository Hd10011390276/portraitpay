/**
 * GET /api/portraits/[id]/certificate
 * 
 * Returns certificate as HTML preview (simpler than PNG in serverless)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const portrait = await prisma.portrait.findUnique({
      where: { id, deletedAt: null },
    });

    if (!portrait) {
      return NextResponse.json({ success: false, error: "Portrait not found" }, { status: 404 });
    }

    if (portrait.ownerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!portrait.blockchainTxHash) {
      return NextResponse.json({ success: false, error: "Portrait not certified on blockchain" }, { status: 400 });
    }

    // Use default values for missing fields  
    const portraitTitle = portrait.title || 'Untitled';
    const idCardName = portrait.idCardName || 'Unknown';
    const idCardType = portrait.idCardType || 'id_card';
    const idCardNumber = portrait.idCardNumber || '****';
    const portraitHash = portrait.portraitImageHash || portrait.imageHash || 'N/A';
    const idCardHash = portrait.idCardFrontHash || 'N/A';
    const network = portrait.blockchainNetwork || 'sepolia';
    const certifiedAt = portrait.certifiedAt ? new Date(portrait.certifiedAt) : new Date();
    const certDateStr = format(certifiedAt, "yyyy年MM月dd日 HH:mm:ss", { locale: zhCN });
    const networkLabel = network === "base" ? "Base Mainnet" : "Ethereum Sepolia";

    const idTypeLabel = idCardType === "driver_license" ? "驾驶证" : 
                     idCardType === "passport" ? "护照" : 
                     idCardType === "us_id" ? "美国身份证" : "身份证";

    // Return HTML certificate
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>区块链肖像认证证书 - ${portraitTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .cert { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #fff; padding: 24px 32px; }
    .header h1 { font-size: 24px; margin-bottom: 4px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .cert-no { margin-top: 12px; font-family: monospace; background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; display: inline-block; }
    .content { padding: 24px 32px; }
    .section { margin-bottom: 20px; }
    .section-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { }
    .info-item .label { font-size: 12px; color: #6b7280; }
    .info-item .value { font-size: 16px; color: #1f2937; }
    .tx-box { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; }
    .tx-box .label { font-size: 12px; color: #6b7280; }
    .tx-box .value { font-family: monospace; font-size: 12px; color: #7c3aed; word-break: break-all; }
    .footer { border-top: 1px solid #e5e7eb; padding: 16px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="header">
      <h1>📜 区块链肖像认证证书</h1>
      <p>PortraitPay AI · Blockchain Portrait Certificate</p>
      <div class="cert-no">证书编号: PPC-${id.slice(-8).toUpperCase()}</div>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-label">认证信息</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">真实姓名</div>
            <div class="value">${idCardName}</div>
          </div>
          <div class="info-item">
            <div class="label">证件类型</div>
            <div class="value">${idTypeLabel}</div>
          </div>
          <div class="info-item">
            <div class="label">证件号码</div>
            <div class="value">****${idCardNumber.slice(-4)}</div>
          </div>
          <div class="info-item">
            <div class="label">肖像标题</div>
            <div class="value">${portraitTitle}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-label">哈希存证</div>
        <div class="info-item">
          <div class="label">肖像照片 SHA-256</div>
          <div class="value" style="word-break:break-all;font-size:11px;font-family:monospace;">${portraitHash}</div>
        </div>
        <div class="info-item" style="margin-top:8px">
          <div class="label">证件照片 SHA-256</div>
          <div class="value" style="word-break:break-all;font-size:11px;font-family:monospace;">${idCardHash}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-label">区块链交易</div>
        <div class="tx-box">
          <div class="label">交易哈希 Transaction Hash</div>
          <div class="value">${portrait.blockchainTxHash}</div>
          <div style="margin-top:8px;text-align:center">
            <a href="https://sepolia.etherscan.io/tx/${portrait.blockchainTxHash}" target="_blank" style="color:#7c3aed;text-decoration:underline;">🔗 查看区块链交易 →</a>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>本证书基于区块链技术生成，肖像照片与证件照片的 SHA-256 哈希值已被永久记录在链上。</p>
      <p>PortraitPay AI · ${networkLabel} · 认证时间: ${certDateStr}</p>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[GET /api/portraits/[id]/certificate]", error);
    return NextResponse.json({ success: false, error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}