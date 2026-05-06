/**
 * Portrait Blockchain Certificate Generator
 * Zero-cost version: SHA-256 hashes + blockchain timestamp (no IPFS, no KYC).
 */

import PDFDocument from "pdfkit";
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
  templatePath: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      const certNo = data.certificateNo ?? generateCertificateNo();
      const certDate = format(data.certifiedAt, "yyyy年MM月dd日 HH:mm:ss", { locale: zhCN });
      const networkLabel = data.network === "base" ? "Base Mainnet" : data.network === "sepolia" ? "Ethereum Sepolia" : data.network;
      const idTypeLabel =
        data.idCardType === "driver_license" ? "驾驶证" :
        data.idCardType === "us_id" ? "美国身份证" :
        data.idCardType === "passport" ? "护照" : "其他证件";

      // Try to load background template; skip background if not found
      let templateLoaded = false;
      try {
        doc.image(templatePath, 0, 0, { fit: doc.page.dimensions as [number, number] });
        templateLoaded = true;
      } catch {
        // No template — draw plain background
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9");
      }

      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const cx = pageW / 2;

      // ── Header ──────────────────────────────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor("#7c3aed")
        .text("区块链肖像认证证书", 0, templateLoaded ? 40 : 30, { align: "center" });

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#9ca3af")
        .text("PortraitPay AI · Blockchain Portrait Certificate", 0, templateLoaded ? 75 : 65, { align: "center" });

      // ── Certificate number ───────────────────────────────────────────
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#d1d5db")
        .text(`证书编号: ${certNo}`, 0, templateLoaded ? 108 : 90, { align: "center" });

      if (templateLoaded) {
        // Draw a subtle divider line under header
        doc
          .moveTo(60, 118)
          .lineTo(pageW - 60, 118)
          .strokeColor("#e5e7eb")
          .lineWidth(1)
          .stroke();
      }

      // ── Certificate holder info ──────────────────────────────────────
      const sectionY = templateLoaded ? 135 : 115;

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#374151")
        .text("认证信息", 70, sectionY);

      // Info box
      const boxY = sectionY + 18;
      const boxH = 130;
      doc
        .rect(60, boxY, pageW - 120, boxH)
        .fillAndStroke("#ffffff", "#e5e7eb");

      const col1X = 80;
      const col2X = pageW / 2 + 20;
      const rowH = 26;
      let row = 0;

      const addRow = (label: string, value: string, x: number) => {
        const ry = boxY + 12 + row * rowH;
        doc.font("Helvetica").fontSize(10).fillColor("#6b7280").text(label, x, ry);
        doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(value, x, ry + 13);
        row++;
      };

      row = 0;
      addRow("真实姓名", data.idCardName, col1X);
      addRow("证件类型", idTypeLabel, col2X);
      row = 0;
      addRow("证件号码", data.idCardNumberMasked, col1X);
      addRow("肖像标题", data.portraitTitle, col2X);

      // ── Hash section ─────────────────────────────────────────────────
      const hashY = boxY + boxH + 20;

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#374151")
        .text("哈希存证", 70, hashY);

      const hashBoxY = hashY + 18;
      const hashBoxH = 90;
      doc
        .rect(60, hashBoxY, pageW - 120, hashBoxH)
        .fillAndStroke("#ffffff", "#e5e7eb");

      const hashRowH = 30;
      const hashCol1X = 80;
      const hashCol2X = pageW / 2 + 20;

      // Portrait hash
      doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("肖像照片 SHA-256", hashCol1X, hashBoxY + 10);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#7c3aed")
        .text(data.portraitImageHash, hashCol1X, hashBoxY + 24, { width: pageW / 2 - 100 });

      // ID card hash
      doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("证件照片 SHA-256", hashCol2X, hashBoxY + 10);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#7c3aed")
        .text(data.idCardFrontHash, hashCol2X, hashBoxY + 24, { width: pageW / 2 - 100 });

      // Blockchain info
      doc
        .moveTo(60, hashBoxY + 60)
        .lineTo(pageW - 60, hashBoxY + 60)
        .strokeColor("#f3f4f6")
        .lineWidth(1)
        .stroke();

      doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("区块链网络", hashCol1X, hashBoxY + 67);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(networkLabel, hashCol1X, hashBoxY + 78);

      doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("认证时间", hashCol2X, hashBoxY + 67);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(certDate, hashCol2X, hashBoxY + 78);

      // ── Transaction hash ─────────────────────────────────────────────
      const txY = hashBoxY + hashBoxH + 20;

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#374151")
        .text("区块链交易", 70, txY);

      const txBoxY = txY + 18;
      const txBoxH = 56;
      doc
        .rect(60, txBoxY, pageW - 120, txBoxH)
        .fillAndStroke("#f5f3ff", "#ddd6fe");

      doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("交易哈希 Transaction Hash", 80, txBoxY + 10);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#7c3aed")
        .text(data.blockchainTxHash, 80, txBoxY + 24, { width: pageW - 160 });

      // ── Footer ──────────────────────────────────────────────────────
      const footerY = pageH - 50;
      doc
        .moveTo(60, footerY - 10)
        .lineTo(pageW - 60, footerY - 10)
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#9ca3af")
        .text(
          "本证书基于区块链技术生成，肖像照片与证件照片的 SHA-256 哈希值已被永久记录在链上，任何一方无法篡改。",
          60,
          footerY,
          { width: pageW - 120, align: "center" }
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#d1d5db")
        .text(
          `PortraitPay AI · ${networkLabel} · Generated at ${certDate}`,
          0,
          footerY + 14,
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}