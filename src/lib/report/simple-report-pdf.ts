/**
 * Simple PDF Report Generator for InfringementReportQuick
 * Generates a professional "侵权报告书" PDF — no blockchain needed (v1.0 free tier)
 */
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { InfringementReportQuick } from "@prisma/client";

const S3_BUCKET = process.env.S3_BUCKET!;
const S3_REGION = process.env.S3_REGION || "us-east-1";
const REPORT_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function generateReportNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 999999).toString().padStart(6, "0");
  return `PP-IR-${year}-${seq}`;
}

function infringementTypeLabel(type: string): string {
  const map: Record<string, string> = {
    AI_FACE_CLONE: "AI换脸/数字人克隆",
    VOICE_CLONE: "声音克隆",
    AI_SHORT_DRAMA: "AI短剧侵权",
    OTHER: "其他侵权",
  };
  return map[type] ?? type;
}

function platformNameLabel(name: string | null | undefined): string {
  if (!name) return "未指定";
  const map: Record<string, string> = {
    youtube: "YouTube",
    douyin: "抖音",
    kuaishou: "快手",
    xiaohongshu: "小红书",
    bilibili: "Bilibili",
    weibo: "微博",
    toutiao: "今日头条",
    weixin: "微信视频号",
    instagram: "Instagram",
    tiktok: "TikTok",
    other: "其他平台",
  };
  return map[name.toLowerCase()] ?? name;
}

export interface ReportData {
  reportNumber: string;
  reportedName: string;
  reportedEmail: string;
  phone: string | null;
  infringementType: string;
  platformUrl: string | null;
  platformName: string | null;
  description: string | null;
  evidenceUrls: string[];
  generatedAt: Date;
}

export async function generateReportPdf(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const buffer = Buffer.from([]);

    doc.on("data", (chunk) => {
      buffer.write(chunk);
    });

    doc.on("end", () => resolve(buffer));
    doc.on("error", reject);

    constW(doc, data);
    doc.end();
  });
}

function constW(doc: PDFKit.PDFDocument, data: ReportData) {
  const fontSize = (size: number) => size;
  const text = (t: string, opts?: object) => doc.text(t, opts);

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill("#7B3FF9");
  doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
    .text("PortraitPay AI — 侵权报告书", 60, 28, { align: "center" });

  doc.moveDown(0.5);
  doc.fillColor("white").fontSize(10)
    .text("PortraitPay AI  ·  www.portraitpayai.com  ·  contact@portraitpayai.com", 60, 52, { align: "center" });

  // Report number banner
  doc.moveDown(2);
  doc.rect(60, doc.y, doc.page.width - 120, 36).fill("#F3F0FF");
  doc.fillColor("#7B3FF9").fontSize(13).font("Helvetica-Bold")
    .text(`报告编号  ${data.reportNumber}`, 60, doc.y + 10, { align: "center" });
  doc.moveDown(2);

  // Section: Victim Info
  sectionHeader(doc, "一、报告人基本信息");
  infoRow(doc, "报告人姓名", data.reportedName);
  infoRow(doc, "报告人邮箱", data.reportedEmail);
  if (data.phone) infoRow(doc, "联系电话", data.phone);

  // Section: Infringement Details
  sectionHeader(doc, "二、侵权信息");
  infoRow(doc, "侵权类型", infringementTypeLabel(data.infringementType));
  infoRow(doc, "发现平台", platformNameLabel(data.platformName));
  if (data.platformUrl) infoRow(doc, "侵权内容链接", data.platformUrl);
  if (data.description) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#374151").text("侵权描述", { continued: false });
    doc.font("Helvetica").fontSize(10).fillColor("#6B7280")
      .text(data.description, { align: "left" });
    doc.moveDown(0.5);
  }

  // Section: Evidence
  if (data.evidenceUrls.length > 0) {
    sectionHeader(doc, "三、证据材料");
    doc.font("Helvetica").fontSize(10).fillColor("#6B7280")
      .text(`（共 ${data.evidenceUrls.length} 张截图，见附件）`, { align: "left" });
    doc.moveDown(0.5);
    data.evidenceUrls.forEach((url, i) => {
      doc.fontSize(9).fillColor("#9CA3AF").text(`  [${i + 1}] ${url}`);
    });
    doc.moveDown(0.5);
  }

  // Section: Disclaimer
  doc.moveDown(1);
  sectionHeader(doc, "四、法律声明");
  const disclaimer = [
    "本报告由 PortraitPay AI 平台根据报告人提供的信息生成，仅供参考。",
    "本报告不构成法律意见，不能替代专业律师的法律服务。",
    "报告人应自行对所提供信息的真实性负责，并承担相应的法律责任。",
    "如需正式法律行动，请持本报告联系具备执业资格的律师或向公安机关报案。",
    "本报告生成时间以系统时间为准，具有唯一性和可追溯性。",
  ];
  disclaimer.forEach((line) => {
    doc.fontSize(9).fillColor("#9CA3AF").text(`· ${line}`);
    doc.moveDown(0.3);
  });

  // Footer
  const footerY = doc.page.height - 60;
  doc.rect(0, footerY - 10, doc.page.width, 1).fill("#E5E7EB");
  doc.fontSize(9).fillColor("#9CA3AF").font("Helvetica")
    .text(`PortraitPay AI 侵权报告  ${data.reportNumber}  |  生成时间：${new Date(data.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`, 60, footerY, { align: "center" });
  doc.text("本报告由PortraitPay AI平台出具  ·  www.portraitpayai.com", 60, footerY + 14, { align: "center" });
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.5);
  doc.rect(60, doc.y - 2, 6, 20).fill("#7B3FF9");
  doc.fillColor("#1F2937").fontSize(12).font("Helvetica-Bold").text(title, 74, doc.y - 2);
  doc.moveDown(0.8);
}

function infoRow(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#374151").text(label + "：", { continued: false });
  doc.font("Helvetica").fontSize(10).fillColor("#6B7280").text(value);
  doc.moveDown(0.3);
}

export async function uploadReportPdf(
  pdfBuffer: Buffer,
  reportNumber: string
): Promise<string> {
  const key = `reports/${reportNumber}.pdf`;
  const s3 = new S3Client({ region: S3_REGION });
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: pdfBuffer,
    ContentType: "application/pdf",
    CacheControl: "private, max-age=86400",
  }));
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}