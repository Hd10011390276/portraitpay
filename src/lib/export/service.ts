// Data Export Service
// Exports earnings reports and authorization records to CSV or PDF

import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

// 鈹€鈹€鈹€ Types 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export type ExportFormat = "csv" | "pdf";

export type ExportEarningsOptions = {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  format: ExportFormat;
};

export type ExportAuthorizationsOptions = {
  userId: string;
  status?: string;
  format: ExportFormat;
};

// 鈹€鈹€鈹€ CSV Utilities 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSVRow(values: unknown[]): string {
  return values.map(escapeCSV).join(",");
}

// 鈹€鈹€鈹€ Export Earnings 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

/**
 * Export earnings transactions as CSV string or PDF buffer.
 */
export async function exportEarnings(options: ExportEarningsOptions): Promise<string | Buffer> {
  const { userId, startDate, endDate, format: fmt } = options;

  const where: Record<string, unknown> = {
    userId,
    type: { in: ["ROYALTY_PAYOUT", "LICENSE_PURCHASE"] },
    status: "COMPLETED",
  };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      authorization: {
        include: {
          portrait: { select: { id: true, title: true } },
          grantee: { select: { displayName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (fmt === "csv") {
    return buildEarningsCSV(transactions, startDate, endDate);
  } else {
    return await buildEarningsPDF(transactions, userId, startDate, endDate);
  }
}

function buildEarningsCSV(
  transactions: any[],
  startDate?: Date,
  endDate?: Date
): string {
  const lines: string[] = [];

  // Header
  lines.push(
    toCSVRow([
      "浜ゆ槗ID",
      "绫诲瀷",
      "閲戦(CNY)",
      "鐘舵€?,
      "鑲栧儚鏍囬",
      "鎺堟潈鏂?,
      "鎺堟潈鏂归偖绠?,
      "鎬绘敹鐩?鍚钩鍙拌垂)",
      "骞冲彴鎵嬬画璐?,
      "鐢ㄦ埛瀹為檯鏀剁泭",
      "鍒涘缓鏃堕棿",
    ])
  );

  for (const t of transactions) {
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    lines.push(
      toCSVRow([
        t.id,
        t.type === "ROYALTY_PAYOUT" ? "鏀剁泭鍒嗘垚" : "鎺堟潈璐拱",
        t.amount.toNumber(),
        t.status,
        t.authorization?.portrait?.title ?? "-",
        t.authorization?.grantee?.displayName ?? "-",
        t.authorization?.grantee?.email ?? "-",
        meta.grossAmount ?? "-",
        meta.platformFee ?? "-",
        t.amount.toNumber(),
        format(new Date(t.createdAt), "yyyy-MM-dd HH:mm:ss"),
      ])
    );
  }

  return lines.join("\n");
}

async function buildEarningsPDF(
  transactions: any[],
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const user = null; // Will look up synchronously is tricky; skip for now
      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("PortraitPay 鏀剁泭鎶ュ憡", { align: "center" });
      doc.moveDown(0.5);

      const period = [
        startDate ? format(startDate, "yyyy-MM-dd") : "鍏ㄩ儴",
        endDate ? format(endDate, "yyyy-MM-dd") : "鑷充粖",
      ].join(" ~ ");
      doc
        .fontSize(10)
        .fillColor("#666")
        .text(`鎶ヨ〃鍛ㄦ湡锛?{period}銆€銆€鐢熸垚鏃堕棿锛?{format(new Date(), "yyyy-MM-dd HH:mm")}`, {
          align: "center",
        });
      doc.moveDown(1);

      // Summary
      const totalRevenue = transactions.reduce(
        (sum: number, t: any) => sum + t.amount.toNumber(),
        0
      );
      const totalGross = transactions.reduce(
        (sum: number, t: any) =>
          sum + ((t.metadata as Record<string, unknown>)?.grossAmount as number ?? 0),
        0
      );
      const totalFee = transactions.reduce(
        (sum: number, t: any) =>
          sum + ((t.metadata as Record<string, unknown>)?.platformFee as number ?? 0),
        0
      );

      doc
        .fontSize(12)
        .fillColor("#000")
        .font("Helvetica-Bold")
        .text("鏀剁泭姹囨€?);
      doc.moveDown(0.3);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`鎬讳氦鏄撶瑪鏁帮細${transactions.length} 绗擿);
      doc.text(`鎬绘敹鐩婏紙鐢ㄦ埛鍑€鏀跺叆锛夛細楼${totalRevenue.toFixed(2)}`);
      doc.text(`鎬绘巿鏉冮噾棰濓紙鍚钩鍙拌垂锛夛細楼${totalGross.toFixed(2)}`);
      doc.text(`骞冲彴鎵嬬画璐癸細楼${totalFee.toFixed(2)}`);
      doc.moveDown(1);

      // Table header
      const tableTop = doc.y;
      const colWidths = [80, 70, 60, 80, 120];
      const headers = ["鏃ユ湡", "绫诲瀷", "閲戦", "鑲栧儚", "鎺堟潈鏂?];
      let x = 50;
      doc.font("Helvetica-Bold").fontSize(9);
      headers.forEach((h, i) => {
        doc.text(h, x, tableTop, { width: colWidths[i], align: "left" });
        x += colWidths[i];
      });

      doc.moveTo(50, tableTop + 14).lineTo(540, tableTop + 14).stroke("#ddd");
      doc.moveDown(0.3);

      // Table rows
      let rowY = tableTop + 18;
      doc.font("Helvetica").fontSize(8.5);

      for (const t of transactions) {
        if (rowY > 700) {
          doc.addPage();
          rowY = 50;
        }

        const row = [
          format(new Date(t.createdAt), "MM-dd"),
          t.type === "ROYALTY_PAYOUT" ? "鏀剁泭鍒嗘垚" : "鎺堟潈璐拱",
          `楼${t.amount.toNumber().toFixed(2)}`,
          (t.authorization?.portrait?.title ?? "-").substring(0, 15),
          (t.authorization?.grantee?.displayName ?? "-").substring(0, 15),
        ];

        x = 50;
        row.forEach((cell, i) => {
          doc.text(String(cell), x, rowY, { width: colWidths[i], align: "left" });
          x += colWidths[i];
        });

        rowY += 16;
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor("#999")
        .text(
          `鏈姤鍛婄敱 PortraitPay AI 绯荤粺鑷姩鐢熸垚锛屼粎渚涚敤鎴峰弬鑰冿紝涓嶄綔涓烘硶寰嬪嚟璇併€俙,
          50,
          780,
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// 鈹€鈹€鈹€ Export Authorizations 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export async function exportAuthorizations(options: ExportAuthorizationsOptions): Promise<string | Buffer> {
  const { userId, status, format: fmt } = options;

  const where: Record<string, unknown> = {
    OR: [{ granterId: userId }, { granteeId: userId }],
  };
  if (status) where.status = status;

  const authorizations = await prisma.authorization.findMany({
    where,
    include: {
      portrait: { select: { id: true, title: true, ownerId: true } },
      granter: { select: { id: true, displayName: true, email: true } },
      grantee: { select: { id: true, displayName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (fmt === "csv") {
    return buildAuthorizationsCSV(authorizations);
  } else {
    return await buildAuthorizationsPDF(authorizations, userId);
  }
}

function buildAuthorizationsCSV(authorizations: any[]): string {
  const lines: string[] = [];
  lines.push(
    toCSVRow([
      "鎺堟潈ID",
      "鐘舵€?,
      "鑲栧儚鏍囬",
      "鎺堟潈鏂?,
      "鎺堟潈鏂归偖绠?,
      "琚巿鏉冩柟",
      "琚巿鏉冩柟閭",
      "鎺堟潈绫诲瀷",
      "鎺堟潈璐?CNY)",
      "寮€濮嬫棩鏈?,
      "缁撴潫鏃ユ湡",
      "閾句笂鍝堝笇",
      "鍒涘缓鏃堕棿",
    ])
  );

  for (const a of authorizations) {
    lines.push(
      toCSVRow([
        a.id,
        a.status,
        a.portrait?.title ?? "-",
        a.granter?.displayName ?? "-",
        a.granter?.email ?? "-",
        a.grantee?.displayName ?? "-",
        a.grantee?.email ?? "-",
        a.licenseType,
        a.licenseFee.toNumber(),
        a.startDate ? format(new Date(a.startDate), "yyyy-MM-dd") : "-",
        a.endDate ? format(new Date(a.endDate), "yyyy-MM-dd") : "姘镐箙",
        a.contractHash ?? "-",
        format(new Date(a.createdAt), "yyyy-MM-dd HH:mm:ss"),
      ])
    );
  }

  return lines.join("\n");
}

async function buildAuthorizationsPDF(authorizations: any[], userId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("PortraitPay 鎺堟潈璁板綍", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor("#666")
        .text(`瀵煎嚭鏃堕棿锛?{format(new Date(), "yyyy-MM-dd HH:mm")}`, { align: "center" });
      doc.moveDown(1);

      // Summary
      const active = authorizations.filter((a) => a.status === "ACTIVE").length;
      const pending = authorizations.filter((a) => a.status === "PENDING").length;
      doc.fontSize(12).fillColor("#000").font("Helvetica-Bold").text("鎺堟潈姹囨€?);
      doc.moveDown(0.3);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`鎬昏褰曟暟锛?{authorizations.length}  |  鐢熸晥涓細${active}  |  寰呭鏍革細${pending}`);
      doc.moveDown(1);

      // Table
      const tableTop = doc.y;
      const colWidths = [70, 55, 70, 100, 100, 70];
      const headers = ["鏃ユ湡", "鐘舵€?, "绫诲瀷", "鑲栧儚", "鎺堟潈鏂?琚巿鏉冩柟", "鎺堟潈璐?];
      let x = 50;
      doc.font("Helvetica-Bold").fontSize(9);
      headers.forEach((h, i) => {
        doc.text(h, x, tableTop, { width: colWidths[i], align: "left" });
        x += colWidths[i];
      });
      doc.moveTo(50, tableTop + 14).lineTo(560, tableTop + 14).stroke("#ddd");
      doc.moveDown(0.3);

      let rowY = tableTop + 18;
      doc.font("Helvetica").fontSize(8.5);

      const STATUS_COLORS: Record<string, string> = {
        ACTIVE: "#16a34a",
        PENDING: "#d97706",
        EXPIRED: "#999",
        REVOKED: "#dc2626",
        REJECTED: "#dc2626",
      };

      for (const a of authorizations) {
        if (rowY > 700) { doc.addPage(); rowY = 50; }

        const isOwner = a.portrait?.ownerId === userId;
        const otherParty = isOwner
          ? a.grantee?.displayName ?? "-"
          : a.granter?.displayName ?? "-";

        const cells = [
          format(new Date(a.createdAt), "MM-dd"),
          a.status,
          a.licenseType,
          (a.portrait?.title ?? "-").substring(0, 12),
          (otherParty as string).substring(0, 12),
          `楼${a.licenseFee.toNumber()}`,
        ];

        x = 50;
        cells.forEach((cell, i) => {
          const color = i === 1 ? (STATUS_COLORS[a.status] ?? "#000") : "#000";
          doc.fillColor(color).text(cell, x, rowY, { width: colWidths[i] });
          x += colWidths[i];
        });
        doc.fillColor("#000");
        rowY += 16;
      }

      doc
        .fontSize(8)
        .fillColor("#999")
        .text("鏈姤鍛婄敱 PortraitPay AI 绯荤粺鑷姩鐢熸垚銆?, 50, 780, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
