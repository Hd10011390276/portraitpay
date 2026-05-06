/**
 * Portrait Blockchain Certificate Generator
 * Zero-cost version: uses Puppeteer to render HTML → PNG screenshot.
 * No native canvas module needed.
 */

import puppeteer from "puppeteer";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export interface PortraitCertificateData {
  portraitTitle: string;
  idCardName: string;
  idCardType: string;
  idCardNumberMasked: string;
  portraitImageHash: string;
  idCardFrontHash: string;
  blockchainTxHash: string;
  network: string;
  certifiedAt: Date;
  certificateNo: string;
}

function generateCertificateNo(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PPC-${date}-${random}`;
}

export async function buildPortraitCertificate(
  data: PortraitCertificateData,
  _templatePath: string
): Promise<Buffer> {
  const certNo = data.certificateNo ?? generateCertificateNo();
  const certDate = format(data.certifiedAt, "yyyy年MM月dd日 HH:mm:ss", { locale: zhCN });
  const networkLabel =
    data.network === "base" ? "Base Mainnet" :
    data.network === "sepolia" ? "Ethereum Sepolia" : data.network;
  const idTypeLabel =
    data.idCardType === "driver_license" ? "驾驶证" :
    data.idCardType === "us_id" ? "美国身份证" :
    data.idCardType === "passport" ? "护照" : "其他证件";

  // ── HTML certificate page (A4 landscape, 1200×848 at 96dpi) ──────
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 848px;
      background: #f9f9f9;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      display: flex; align-items: center; justify-content: center;
    }
    .cert {
      width: 1120px; height: 768px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 40px 48px;
      display: flex; flex-direction: column;
    }
    /* Header */
    .header { text-align: center; margin-bottom: 28px; }
    .header h1 { font-size: 30px; font-weight: 700; color: #7c3aed; margin-bottom: 6px; }
    .header p { font-size: 12px; color: #9ca3af; }
    .cert-no { text-align: center; font-size: 10px; color: #d1d5db; margin-top: 4px; }

    /* Divider */
    .divider { height: 1px; background: #e5e7eb; margin-bottom: 24px; }

    /* Info section */
    .section { margin-bottom: 20px; }
    .section-label { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px; }
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px; padding: 12px 16px;
      gap: 0;
    }
    .info-item { padding: 6px 0; }
    .info-item .label { font-size: 10px; color: #6b7280; margin-bottom: 2px; }
    .info-item .value { font-size: 12px; font-weight: 700; color: #111827; }
    .info-item .value.purple { color: #7c3aed; font-family: monospace; font-size: 10px; }
    .info-item .value.name { font-size: 13px; }
    .grid-row { display: flex; }
    .grid-row .info-item { flex: 1; }

    /* Hash section */
    .hash-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      border: 1px solid #e5e7eb;
      border-radius: 6px; padding: 12px 16px;
      background: #fff;
      margin-bottom: 20px;
    }
    .hash-item { padding: 4px 0; }
    .hash-item .label { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
    .hash-item .value { font-size: 10px; color: #7c3aed; font-family: monospace; word-break: break-all; line-height: 1.5; }
    .hash-divider { border-top: 1px solid #f3f4f6; margin: 10px 0; }
    .hash-bottom { display: flex; gap: 40px; }
    .hash-bottom .info-item { padding: 0; }

    /* Tx section */
    .tx-box {
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .tx-box .label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
    .tx-box .value { font-size: 10px; color: #7c3aed; font-family: monospace; word-break: break-all; line-height: 1.5; }

    /* Footer */
    .footer { margin-top: auto; }
    .footer-line { height: 1px; background: #e5e7eb; margin-bottom: 16px; }
    .footer p { font-size: 8px; color: #9ca3af; text-align: center; line-height: 1.6; }
    .footer p + p { color: #d1d5db; margin-top: 2px; }
  </style>
</head>
<body>
<div class="cert">
  <div class="header">
    <h1>区块链肖像认证证书</h1>
    <p>PortraitPay AI · Blockchain Portrait Certificate</p>
    <div class="cert-no">证书编号: ${certNo}</div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-label">认证信息</div>
    <div class="info-grid">
      <div class="grid-row">
        <div class="info-item">
          <div class="label">真实姓名</div>
          <div class="value name">${data.idCardName}</div>
        </div>
        <div class="info-item">
          <div class="label">证件类型</div>
          <div class="value">${idTypeLabel}</div>
        </div>
      </div>
      <div class="grid-row">
        <div class="info-item">
          <div class="label">证件号码</div>
          <div class="value">${data.idCardNumberMasked}</div>
        </div>
        <div class="info-item">
          <div class="label">肖像标题</div>
          <div class="value">${data.portraitTitle}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">哈希存证</div>
    <div class="hash-grid">
      <div class="hash-item">
        <div class="label">肖像照片 SHA-256</div>
        <div class="value">${data.portraitImageHash}</div>
      </div>
      <div class="hash-item">
        <div class="label">证件照片 SHA-256</div>
        <div class="value">${data.idCardFrontHash}</div>
      </div>
      <div class="hash-divider"></div>
      <div class="hash-divider"></div>
      <div class="hash-bottom">
        <div class="info-item">
          <div class="label">区块链网络</div>
          <div class="value">${networkLabel}</div>
        </div>
        <div class="info-item">
          <div class="label">认证时间</div>
          <div class="value">${certDate}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">区块链交易</div>
    <div class="tx-box">
      <div class="label">交易哈希 Transaction Hash</div>
      <div class="value">${data.blockchainTxHash}</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-line"></div>
    <p>本证书基于区块链技术生成，肖像照片与证件照片的 SHA-256 哈希值已被永久记录在链上，任何一方无法篡改。</p>
    <p>PortraitPay AI · ${networkLabel} · Generated at ${certDate}</p>
  </div>
</div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 848, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}