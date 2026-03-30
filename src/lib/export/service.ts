// Data Export Service
// Exports earnings reports and authorization records to CSV or PDF

import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── CSV Utilities ───────────────────────────────────────────────────────────

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

// ─── Export Earnings ─────────────────────────────────────────────────────────

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
      "交易ID",
      "类型",
      "金额(CNY)",
      "状态",
      "肖像标题",
      "授权方",
      "授权方邮箱",
      "总收益(含平台费)",
      "平台手续费",
      "用户实际收益",
      "创建时间",
    ])
  );

  for (const t of transactions) {
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    lines.push(
      toCSVRow([
        t.id,
        t.type === "ROYALTY_PAYOUT" ? "收益分成" : "授权购买",
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
        .text("PortraitPay 收益报告", { align: "center" });
      doc.moveDown(0.5);

      const period = [
        startDate ? format(startDate, "yyyy-MM-dd") : "全部",
        endDate ? format(endDate, "yyyy-MM-dd") : "至今",
      ].join(" ~ ");
      doc
        .fontSize(10)
        .fillColor("#666")
        .text(`报表周期：${period}　　生成时间：${format(new Date(), "yyyy-MM-dd HH:mm")}`, {
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
        .text("收益汇总");
      doc.moveDown(0.3);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`总交易笔数：${transactions.length} 笔`);
      doc.text(`总收益（用户净收入）：¥${totalRevenue.toFixed(2)}`);
      doc.text(`总授权金额（含平台费）：¥${totalGross.toFixed(2)}`);
      doc.text(`平台手续费：¥${totalFee.toFixed(2)}`);
      doc.moveDown(1);

      // Table header
      const tableTop = doc.y;
      const colWidths = [80, 70, 60, 80, 120];
      const headers = ["日期", "类型", "金额", "肖像", "授权方"];
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
          t.type === "ROYALTY_PAYOUT" ? "收益分成" : "授权购买",
          `¥${t.amount.toNumber().toFixed(2)}`,
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
          `本报告由 PortraitPay AI 系统自动生成，仅供用户参考，不作为法律凭证。`,
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

// ─── Export Authorizations ───────────────────────────────────────────────────

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
      "授权ID",
      "状态",
      "肖像标题",
      "授权方",
      "授权方邮箱",
      "被授权方",
      "被授权方邮箱",
      "授权类型",
      "授权费(CNY)",
      "开始日期",
      "结束日期",
      "链上哈希",
      "创建时间",
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
        a.endDate ? format(new Date(a.endDate), "yyyy-MM-dd") : "永久",
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
        .text("PortraitPay 授权记录", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor("#666")
        .text(`导出时间：${format(new Date(), "yyyy-MM-dd HH:mm")}`, { align: "center" });
      doc.moveDown(1);

      // Summary
      const active = authorizations.filter((a) => a.status === "ACTIVE").length;
      const pending = authorizations.filter((a) => a.status === "PENDING").length;
      doc.fontSize(12).fillColor("#000").font("Helvetica-Bold").text("授权汇总");
      doc.moveDown(0.3);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`总记录数：${authorizations.length}  |  生效中：${active}  |  待审核：${pending}`);
      doc.moveDown(1);

      // Table
      const tableTop = doc.y;
      const colWidths = [70, 55, 70, 100, 100, 70];
      const headers = ["日期", "状态", "类型", "肖像", "授权方/被授权方", "授权费"];
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
          `¥${a.licenseFee.toNumber()}`,
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
        .text("本报告由 PortraitPay AI 系统自动生成。", 50, 780, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
