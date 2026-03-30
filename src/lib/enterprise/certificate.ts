/**
 * Authorization Certificate Generator
 * 生成授权证书 PDF
 */
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage";
import { format } from "date-fns";
import { Readable } from "stream";

async function buildCertificatePDF(
  certNo: string,
  portrait: { title: string; id: string; imageHash?: string },
  owner: { name: string; email: string },
  enterprise: { companyName: string; contactName: string; unifiedCreditCode: string },
  usageScope: string[],
  usageDuration: number,
  startDate: Date,
  endDate: Date,
  fee: string,
  currency: string,
  contractHash?: string,
  issuedAt?: Date
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 120; // usable width

    // --- 背景色块 ---
    doc.rect(40, 40, W + 40, doc.page.height - 80)
      .fill("#f8f6ff");

    // --- 顶部装饰线 ---
    doc.strokeColor("#6b46c1")
      .lineWidth(3)
      .moveTo(40, 60)
      .lineTo(W + 80, 60)
      .stroke();

    // --- 标题 ---
    doc.fillColor("#1a1a2e")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("PORTRAIT PAY AI", 60, 80, { align: "center", width: W });

    doc.fillColor("#6b46c1")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("肖像授权使用证书", 60, 120, { align: "center", width: W });

    doc.moveDown(1.5);

    // --- 证书编号 ---
    doc.fillColor("#888")
      .fontSize(10)
      .font("Helvetica")
      .text(`证书编号 / Certificate No.: ${certNo}`, 60, 170, {
        align: "center", width: W,
      });

    if (issuedAt) {
      doc.text(
        `发证日期 / Issued: ${format(issuedAt, "yyyy年MM月dd日")}`,
        60, 185, { align: "center", width: W }
      );
    }

    // --- 分隔线 ---
    doc.strokeColor("#ddd")
      .lineWidth(1)
      .moveTo(80, 215)
      .lineTo(W + 40, 215)
      .stroke();

    // --- 正文内容 ---
    let y = 240;
    const leftX = 80;
    const rightX = W + 40;
    const lineHeight = 26;
    const labelWidth = 140;

    function row(label: string, value: string) {
      doc.fillColor("#6b46c1").fontSize(11).font("Helvetica-Bold")
        .text(label, leftX, y, { width: labelWidth });
      doc.fillColor("#1a1a2e").fontSize(11).font("Helvetica")
        .text(value, leftX + labelWidth, y, { width: rightX - leftX - labelWidth });
      y += lineHeight;
    }

    row("肖像名称 / Portrait", portrait.title);
    row("授权企业 / Enterprise", enterprise.companyName);
    row("统一社会信用代码 / USC", enterprise.unifiedCreditCode);
    row("企业联系人 / Contact", enterprise.contactName);
    row("授权类型 / License Type", "NON_EXCLUSIVE");
    row("使用范围 / Usage Scope", usageScope.join("、"));
    row("地域范围 / Territory", "全球 / Global");
    row("授权期限 / Duration", `${usageDuration}天`);
    row("有效期 / Validity", `${format(startDate, "yyyy-MM-dd")} ~ ${format(endDate, "yyyy-MM-dd")}`);
    row("授权费用 / Fee", `${fee} ${currency}`);

    // --- 授权人信息 ---
    y += 10;
    doc.strokeColor("#ddd").lineWidth(0.5)
      .moveTo(leftX, y).lineTo(rightX, y).stroke();
    y += 15;

    doc.fillColor("#6b46c1").fontSize(11).font("Helvetica-Bold")
      .text("肖像所有者 / Portrait Owner", leftX, y);
    doc.fillColor("#1a1a2e").fontSize(11).font("Helvetica")
      .text(`${owner.name} (${owner.email})`, leftX + labelWidth, y);
    y += lineHeight;

    // --- 平台签章 ---
    y += 20;
    doc.strokeColor("#6b46c1").lineWidth(1.5)
      .moveTo(leftX, y).lineTo(leftX + 150, y).stroke();
    y += 8;
    doc.fillColor("#6b46c1").fontSize(10).font("Helvetica-Bold")
      .text("PortraitPay AI 平台认证", leftX, y);
    y += 16;
    doc.fillColor("#888").fontSize(9).font("Helvetica")
      .text("Platform Certification", leftX, y);

    // --- 右下角平台信息 ---
    doc.fillColor("#888").fontSize(9).font("Helvetica")
      .text("portraitpayai.com", rightX - 150, doc.page.height - 80);

    if (contractHash) {
      doc.fillColor("#aaa").fontSize(8).font("Helvetica")
        .text(`合同哈希: ${contractHash.substring(0, 24)}...`, rightX - 150, doc.page.height - 65, {
          width: 150,
        });
    }

    // --- 防伪提示 ---
    doc.fillColor("#ccc").fontSize(7.5).font("Helvetica")
      .text(
        "本证书由 PortraitPay AI 平台出具，具有法律效力。扫码验证请访问 portraitpayai.com/verify",
        leftX, doc.page.height - 50, { width: W }
      );

    doc.end();
  });
}

export async function generateCertificatePDF(
  applicationId: string,
  authorizationId: string,
  certNo: string,
  endDate: Date
) {
  const application = await prisma.entAuthApplication.findUnique({
    where: { id: applicationId },
    include: {
      portrait: { include: { owner: true } },
    },
  });
  if (!application) throw new Error("Application not found");

  const enterprise = await prisma.enterprise.findUnique({
    where: { id: application.enterpriseId },
  });
  if (!enterprise) throw new Error("Enterprise not found");

  const auth = await prisma.authorization.findUnique({
    where: { id: authorizationId },
  });
  if (!auth) throw new Error("Authorization not found");

  const pdfBuffer = await buildCertificatePDF(
    certNo,
    {
      title: application.portrait.title,
      id: application.portrait.id,
      imageHash: application.portrait.imageHash ?? undefined,
    },
    {
      name: application.portrait.owner.displayName ?? application.portrait.owner.email ?? "N/A",
      email: application.portrait.owner.email ?? "",
    },
    {
      companyName: enterprise.companyName,
      contactName: enterprise.contactName,
      unifiedCreditCode: enterprise.unifiedCreditCode,
    },
    application.usageScope,
    application.usageDuration,
    auth.startDate,
    endDate,
    auth.licenseFee.toString(),
    auth.currency,
    auth.contractHash ?? undefined,
    new Date()
  );

  // 上传 PDF 到存储
  const fileName = `certificates/${certNo}.pdf`;
  const pdfUrl = await storageService.uploadFile(pdfBuffer, fileName, "application/pdf");

  // 创建证书记录
  await prisma.authorizationCertificate.create({
    data: {
      applicationId,
      authorizationId,
      certificateNo: certNo,
      expiresAt: endDate,
      pdfUrl,
      blockchainTxHash: auth.contractHash,
      blockchainNetwork: "sepolia",
    },
  });

  return pdfUrl;
}

export async function getCertificatePDF(applicationId: string) {
  const cert = await prisma.authorizationCertificate.findUnique({
    where: { applicationId },
  });
  if (!cert) throw new Error("Certificate not found");
  return cert;
}
