/**
 * Portrait Blockchain Certificate Generator
 * Uses PDFKit to overlay text onto the certificate template image.
 */

import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export interface PortraitCertificateData {
  portraitTitle: string;
  ownerName: string;
  ownerEmail: string;
  imageHash: string;
  blockchainTxHash: string;
  ipfsCid: string;
  network: string;
  certifiedAt: Date;
  certificateNo: string;
}

function generateCertificateNo(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PPC-${date}-${random}`;
}

/**
 * Build a portrait blockchain certificate PDF.
 * Uses the certificate template image from public/images/blockchain-certificate-template.png
 * and overlays certificate details on top.
 */
export async function buildPortraitCertificate(
  data: PortraitCertificateData,
  templatePath: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Embed the certificate template background image
      doc.image(templatePath, 0, 0, {
        fit: [842, 595], // A4 landscape dimensions in points
        align: "center",
        valign: "center",
      });

      // ── Certificate Title ────────────────────────────────────────────────
      doc.registerFont("SimHei", "C:/Windows/Fonts/simhei.ttf").catch(() => {
        // Fallback: skip custom font if not available
      });

      const FONT_NORMAL = "Helvetica";
      const FONT_BOLD = "Helvetica-Bold";
      const COLOR_DARK = "#1a1a2e";
      const COLOR_PURPLE = "#7c3aed";
      const COLOR_GRAY = "#4a4a6a";

      // Since PDFKit image is blocking, let's do text overlay at fixed positions.
      // Certificate template layout (landscape A4 842x595):
      // We'll position text elements based on assumed template design.
      // Template is 842x595 points. Text should appear in the middle "content" area.

      const centerX = 842 / 2; // 421
      const contentY = 280;    // approximate vertical center for text

      // ── Portrait Title ───────────────────────────────────────────────────
      doc
        .font(FONT_BOLD)
        .fontSize(22)
        .fillColor(COLOR_PURPLE)
        .text(
          data.portraitTitle,
          0,          // x
          contentY - 40, // y
          { align: "center", width: 842 }
        );

      // ── Certificate Label ─────────────────────────────────────────────────
      doc
        .font(FONT_NORMAL)
        .fontSize(11)
        .fillColor(COLOR_GRAY)
        .text(
          "BLOCKCHAIN CERTIFICATE OF PORTRAIT RIGHTS",
          0,
          contentY - 12,
          { align: "center", width: 842 }
        );

      // ── Decorative line ───────────────────────────────────────────────────
      doc
        .moveTo(300, contentY + 2)
        .lineTo(542, contentY + 2)
        .lineWidth(0.5)
        .stroke(COLOR_PURPLE);

      // ── Owner Name ────────────────────────────────────────────────────────
      doc
        .font(FONT_BOLD)
        .fontSize(13)
        .fillColor(COLOR_DARK)
        .text(
          `Certificate Holder: ${data.ownerName}`,
          0,
          contentY + 14,
          { align: "center", width: 842 }
        );

      // ── Email ────────────────────────────────────────────────────────────
      doc
        .font(FONT_NORMAL)
        .fontSize(10)
        .fillColor(COLOR_GRAY)
        .text(
          `Email: ${data.ownerEmail}`,
          0,
          contentY + 32,
          { align: "center", width: 842 }
        );

      // ── Certificate Number ───────────────────────────────────────────────
      doc
        .font(FONT_BOLD)
        .fontSize(10)
        .fillColor(COLOR_PURPLE)
        .text(
          `Certificate No.: ${data.certificateNo}`,
          0,
          contentY + 50,
          { align: "center", width: 842 }
        );

      // ── Blockchain Info Block ────────────────────────────────────────────
      const infoY = contentY + 72;

      // Two-column layout for blockchain info
      const col1X = 180;
      const col2X = 500;
      const labelW = 80;
      const valueW = 280;
      const rowH = 16;

      doc.font(FONT_BOLD).fontSize(8.5).fillColor(COLOR_GRAY);

      // Row: Blockchain Network
      doc.text("Network:", col1X, infoY, { width: labelW });
      doc.font(FONT_NORMAL).fillColor(COLOR_DARK).text(data.network === "sepolia" ? "Ethereum Sepolia Testnet" : data.network, col1X + labelW, infoY, { width: valueW });
      doc.font(FONT_BOLD).fillColor(COLOR_GRAY).text("Certified At:", col2X, infoY, { width: labelW });
      doc.font(FONT_NORMAL).fillColor(COLOR_DARK).text(
        format(data.certifiedAt, "yyyy-MM-dd HH:mm:ss", { locale: zhCN }),
        col2X + labelW, infoY, { width: valueW }
      );

      // Row: Image Hash
      doc.font(FONT_BOLD).fillColor(COLOR_GRAY);
      doc.text("Image Hash:", col1X, infoY + rowH, { width: labelW });
      doc.font(FONT_NORMAL).fillColor(COLOR_DARK).text(
        data.imageHash.substring(0, 32) + "...",
        col1X + labelW, infoY + rowH, { width: valueW }
      );
      doc.font(FONT_BOLD).fillColor(COLOR_GRAY).text("IPFS CID:", col2X, infoY + rowH, { width: labelW });
      doc.font(FONT_NORMAL).fillColor(COLOR_DARK).text(
        data.ipfsCid.substring(0, 32) + "...",
        col2X + labelW, infoY + rowH, { width: valueW }
      );

      // Row: Transaction Hash (full, small font)
      doc.font(FONT_BOLD).fillColor(COLOR_GRAY);
      doc.text("Tx Hash:", col1X, infoY + rowH * 2, { width: labelW });
      doc.font(FONT_NORMAL).fillColor(COLOR_DARK).fontSize(7.5).text(
        data.blockchainTxHash,
        col1X + labelW, infoY + rowH * 2, { width: 560 }
      );

      // ── Footer ────────────────────────────────────────────────────────────
      doc
        .font(FONT_NORMAL)
        .fontSize(7.5)
        .fillColor("#999")
        .text(
          "This certificate confirms that the above portrait has been cryptographically registered on the blockchain. " +
          "The portrait rights information is stored permanently on IPFS and linked via the blockchain transaction. " +
          "This document is auto-generated by PortraitPay AI and does not require a signature.",
          60,  // x
          520, // y
          { align: "center", width: 720, lineGap: 2 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}