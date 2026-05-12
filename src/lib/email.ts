/**
 * Email utility — Resend (primary) or Nodemailer + SMTP (fallback)
 *
 * 环境变量配置:
 * - RESEND_API_KEY    (Resend API key, 推荐使用)
 * - SMTP_HOST         (默认: smtp.exmail.qq.com)
 * - SMTP_PORT         (默认: 465)
 * - SMTP_USER         (发件邮箱，如 contact@portraitpayai.com)
 * - SMTP_PASS         (SMTP 授权码)
 * - EMAIL_FROM        (发件地址)
 * - EMAIL_FROM_NAME   (发件人名称，默认 PortraitPay AI)
 * - ADMIN_EMAIL       (通知邮件收件人)
 */

import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export interface ContactEmailData {
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  type: "GENERAL" | "ENTERPRISE" | "CELEBRITY";
  // Enterprise extra
  enterpriseName?: string;
  intendedUse?: string;
  expectedScale?: string;
  contactPhone?: string;
}

// ============================================================
// Nodemailer transporter (created fresh each time to avoid stale credentials)
// ============================================================
function createTransporter(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST ?? "smtp.exmail.qq.com";
  const port = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASS ?? "";

  if (!user || !pass) {
    throw new Error("SMTP credentials not configured: SMTP_USER / SMTP_PASS environment variables are required");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465 (SSL), false for other ports
    auth: {
      user,
      pass,
    },
  });
}

// ============================================================
// Email sender (Resend preferred, SMTP fallback)
// ============================================================
async function sendViaSMTP(opts: EmailOptions): Promise<void> {
  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "noreply@portraitpayai.com";
  const fromName = process.env.EMAIL_FROM_NAME ?? "PortraitPay AI";
  const toAddresses = Array.isArray(opts.to) ? opts.to : [opts.to];

  // Try Resend first if API key is configured
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${from}>`,
        to: toAddresses,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        attachments: opts.attachments?.map(a => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
        })),
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      console.log("[Email] Sent via Resend:", data?.id, "to:", opts.to);
      return;
    } catch (resendErr) {
      console.error("[Email] Resend failed, falling back to SMTP:", resendErr instanceof Error ? resendErr.message : String(resendErr));
      // Fall through to SMTP
    }
  }

  // Fallback to SMTP
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to: toAddresses.join(", "),
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments,
  });

  console.log("[Email] Sent via SMTP:", info.messageId, "to:", opts.to);
}

// ============================================================
// Contact notification HTML template
// ============================================================
function buildContactNotificationEmail(data: ContactEmailData): { subject: string; html: string; text: string } {
  const isEnterprise = data.type === "ENTERPRISE";
  const isCelebrity = data.type === "CELEBRITY";
  const subject = isEnterprise
    ? `【企业入驻咨询】${data.name} - ${data.enterpriseName ?? data.company ?? ""}`
    : isCelebrity
    ? `【艺人入驻申请】${data.name} - ${data.subject ?? ""}（${data.enterpriseName ?? ""}）`
    : `【联系表单】${data.name} - ${data.subject ?? ""}`;

  const rows = [
    ["姓名", data.name],
    ["邮箱", data.email],
    ...(isCelebrity
      ? [
          ["艺名/舞台名", data.subject ?? "—"],
          ["艺人类型", data.enterpriseName ?? "—"],
          ["联系电话", data.contactPhone ?? "—"],
          ["社交媒体", data.intendedUse ?? "—"],
          ["所属机构", data.company ?? "—"],
        ]
      : [
          ["公司", data.company ?? "—"],
          ...(isEnterprise
            ? [
                ["企业名称", data.enterpriseName ?? "—"],
                ["联系电话", data.contactPhone ?? "—"],
                ["预期规模", data.expectedScale ?? "—"],
                ["用途说明", data.intendedUse ?? "—"],
              ]
            : []),
        ]),
    ["留言内容", data.message],
  ]
    .map(([k, v]) => `<tr><td style="padding:8px 12px;font-weight:bold;color:#666;white-space:nowrap">${k}</td><td style="padding:8px 12px">${v}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#7c3aed;padding:20px 24px">
    <h2 style="margin:0;color:#fff;font-size:18px">${isEnterprise ? "🏢 企业入驻咨询" : isCelebrity ? "🌟 艺人入驻申请" : "📋 联系表单通知"}</h2>
    <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">PortraitPay AI · 新消息</p>
  </div>
  <div style="padding:24px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12px;color:#999">提交时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/contacts" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">前往管理后台 →</a>
  </div>
</div>
</body>
</html>`;

  const text = [
    `${isEnterprise ? "企业入驻咨询" : isCelebrity ? "艺人入驻申请" : "联系表单通知"}`,
    ...rows.replace(/<[^>]+>/g, "").split("\n").filter(Boolean),
    `提交时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    `管理后台: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/contacts`,
  ].join("\n");

  return { subject, html, text };
}

// ============================================================
// Main send function
// ============================================================
export async function sendEmail(opts: EmailOptions): Promise<void> {
  await sendViaSMTP(opts);
}

export async function sendContactNotification(data: ContactEmailData): Promise<void> {
  const adminEmail = process.env.CONTACT_TO_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@portraitpayai.com";
  const { subject, html, text } = buildContactNotificationEmail(data);

  await sendEmail({
    to: adminEmail,
    subject,
    html,
    text,
  });
}

// ============================================================
// Portrait certified email
// ============================================================
interface PortraitCertifiedEmailParams {
  name: string;
  email: string;
  portraitTitle: string;
  portraitImageHash: string;
  idCardFrontHash: string;
  idCardName: string;
  idCardType: string;
  idCardNumberMasked: string;
  blockchainTxHash: string;
  network: string;
  certifiedAt: string;
  certificateBuffer?: Buffer;
  certificateUrl?: string;
  certificateNo?: string;
  isEarlyContributor?: boolean;
}

export async function sendPortraitCertifiedEmail(params: PortraitCertifiedEmailParams): Promise<void> {
  const { name, email, portraitTitle, portraitImageHash, idCardFrontHash, idCardName, idCardType, idCardNumberMasked, blockchainTxHash, network, certifiedAt, certificateBuffer, certificateUrl, certificateNo, isEarlyContributor } = params;
  const explorerUrl = network === "base" ? "https://basescan.org/tx/" : "https://etherscan.io/tx/";
  const txUrl = `${explorerUrl}${blockchainTxHash}`;
  const certifiedAtStr = new Date(certifiedAt).toLocaleString("en-US", { timeZone: "UTC" });

  const idTypeLabel = idCardType === "driver_license" ? "Driver License" : idCardType === "us_id" ? "US ID" : idCardType === "passport" ? "Passport" : "Other";
  const earlyBadge = isEarlyContributor ? '<div style="background:#fbbf24;color:#000;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:bold;margin-bottom:16px;text-align:center">★ EARLY CONTRIBUTOR — Certificate #' + certificateNo + ' ★</div>' : '';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#7c3aed;padding:20px 24px">
    <h2 style="margin:0;color:#fff;font-size:18px">Portrait Blockchain Certification Complete</h2>
    <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">PortraitPay AI · Certification Notice</p>
  </div>
  <div style="padding:24px">
    ${earlyBadge}
    <p style="font-size:15px;color:#333">Hello ${name}!</p>
    <p style="font-size:15px;color:#333">Your portrait <strong>"${portraitTitle}"</strong> has been successfully registered on the blockchain — permanently stored and tamper-proof.</p>
    ${certificateNo ? '<p style="font-size:15px;color:#7c3aed;font-weight:bold">Certificate No: ' + certificateNo + '</p>' : ''}
    <div style="margin:20px 0;padding:16px;background:#f9f9f9;border-radius:8px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#666;font-size:13px">Legal Name</td><td style="padding:6px 0;font-size:13px;font-weight:bold;color:#333">${idCardName}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">ID Type</td><td style="padding:6px 0;font-size:13px">${idTypeLabel}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">ID Number</td><td style="padding:6px 0;font-size:13px;font-family:monospace;color:#7c3aed">${idCardNumberMasked}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">Portrait Photo Hash</td><td style="padding:6px 0;font-size:11px;font-family:monospace;color:#7c3aed;word-break:break-all">${portraitImageHash.slice(0, 20)}...</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">ID Photo Hash</td><td style="padding:6px 0;font-size:11px;font-family:monospace;color:#7c3aed;word-break:break-all">${idCardFrontHash.slice(0, 20)}...</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">Blockchain Network</td><td style="padding:6px 0;font-size:13px">${network === "base" ? "Base Mainnet" : network}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">Certification Time</td><td style="padding:6px 0;font-size:13px">${certifiedAtStr}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">Transaction Hash</td><td style="padding:6px 0;font-size:12px;font-family:monospace;color:#7c3aed">${blockchainTxHash.slice(0, 16)}...</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:20px 0">
      <a href="${txUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">View Blockchain Transaction →</a>
    </div>
    <p style="font-size:12px;color:#999">This is an automated system notification. Please do not reply. Contact support@portraitpayai.com for questions.</p>
  </div>
</div>
</body>
</html>`;

  const text = `PortraitPay AI — Portrait Blockchain Certification Complete\n\nHello ${name}!\nYour portrait "${portraitTitle}" has been successfully registered on the blockchain — permanently stored and tamper-proof.\n${certificateNo ? 'Certificate No: ' + certificateNo + '\n' : ''}\nLegal Name: ${idCardName}\nID Type: ${idTypeLabel}\nID Number: ${idCardNumberMasked}\nPortrait Photo Hash: ${portraitImageHash}\nID Photo Hash: ${idCardFrontHash}\nBlockchain Network: ${network === "base" ? "Base Mainnet" : network}\nCertification Time: ${certifiedAtStr}\nTransaction Hash: ${blockchainTxHash}\n\nView Blockchain Transaction: ${txUrl}\n\nThis is an automated system notification. Please do not reply.`;

  try {
    await sendEmail({
      to: email,
      subject: `Portrait Certification Complete - ${portraitTitle}`,
      html,
      text,
      attachments: certificateBuffer
        ? [
            {
              filename: `portrait-certificate-${certificateNo ?? portraitTitle.replace(/\s+/g, "-")}.png`,
              content: certificateBuffer,
              contentType: "image/png",
            },
          ]
        : undefined,
    });
    console.log("[sendPortraitCertifiedEmail] Sent to:", email);
  } catch (err) {
    // Non-blocking: log but don't throw
    console.error("[sendPortraitCertifiedEmail] SMTP send failed (non-blocking):", err instanceof Error ? err.message : String(err));
    console.log("[sendPortraitCertifiedEmail] Would have sent to:", email, "subject:", `✅ 肖像认证成功 - ${portraitTitle}`);
  }
}

// ============================================================
// Portrait mint failed email
// ============================================================
interface PortraitMintFailedEmailParams {
  name: string;
  email: string;
  portraitTitle: string;
  reason: string;
}

export async function sendPortraitMintFailedEmail(params: PortraitMintFailedEmailParams): Promise<void> {
  const { name, email, portraitTitle, reason } = params;
  const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#dc2626;padding:20px 24px">
    <h2 style="margin:0;color:#fff;font-size:18px">❌ 区块链上链失败</h2>
    <p style="margin:4px 0 0;color:#fecaca;font-size:13px">PortraitPay AI · 认证失败通知</p>
  </div>
  <div style="padding:24px">
    <p style="font-size:15px;color:#333">${name}，您好！</p>
    <p style="font-size:15px;color:#333">您的肖像 <strong>"${portraitTitle}"</strong> 在区块链上链过程中未能通过身份核验，上链已被拒绝。</p>
    <div style="margin:20px 0;padding:16px;background:#fef2f2;border-radius:8px;border-left:4px solid #dc2626">
      <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#991b1b">❌ 认证失败原因：</p>
      <p style="margin:0;font-size:14px;color:#991b1b">${reason}</p>
    </div>
    <div style="margin:20px 0;padding:16px;background:#f9f9f9;border-radius:8px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#333">📋 如何解决：</p>
      <ol style="margin:0;padding-left:20px;color:#666;font-size:13px;line-height:1.8">
        <li>重新上传一张清晰、正对摄像头的人脸照片（纯色背景最佳）</li>
        <li>确保证件照片和本次人脸为同一人</li>
        <li>在光线充足的环境下重新操作</li>
        <li>如果证件信息有变更，请先更新身份证信息</li>
      </ol>
    </div>
    <div style="text-align:center;margin:20px 0">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">重新上传肖像 →</a>
    </div>
    <p style="font-size:12px;color:#999">请求时间：${timestamp}</p>
    <p style="font-size:12px;color:#999">此通知由系统自动发送，请勿回复。如有疑问请联系 support@portraitpayai.com</p>
  </div>
</div>
</body>
</html>`;

  const text = `PortraitPay AI — 区块链上链失败通知\n\n${name}，您好！\n您的肖像 "${portraitTitle}" 在区块链上链过程中未能通过身份核验，上链已被拒绝。\n\n失败原因：\n${reason}\n\n如何解决：\n1. 重新上传一张清晰、正对摄像头的人脸照片（纯色背景最佳）\n2. 确保证件照片和本次人脸为同一人\n3. 在光线充足的环境下重新操作\n4. 如果证件信息有变更，请先更新身份证信息\n\n请求时间：${timestamp}\n\n此通知由系统自动发送，请勿回复。`;

  try {
    await sendEmail({
      to: email,
      subject: `❌ 区块链上链失败 - ${portraitTitle}`,
      html,
      text,
    });
    console.log("[sendPortraitMintFailedEmail] Sent to:", email);
  } catch (err) {
    // Non-blocking: log but don't throw
    console.error("[sendPortraitMintFailedEmail] SMTP send failed (non-blocking):", err instanceof Error ? err.message : String(err));
    console.log("[sendPortraitMintFailedEmail] Would have sent to:", email, "subject:", `❌ 区块链上链失败 - ${portraitTitle}`, "reason:", reason);
  }
}

// ============================================================
// Welcome email
// ============================================================
interface WelcomeEmailParams {
  name: string;
  email: string;
  role?: string;
}

export async function sendWelcomeEmail({ name, email, role: _role }: WelcomeEmailParams): Promise<void> {
  console.log("[sendWelcomeEmail] Attempting to send welcome email to:", email, "name:", name);
  try {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#7c3aed;padding:20px 24px">
    <h2 style="margin:0;color:#fff;font-size:18px">欢迎来到 PortraitPay AI</h2>
    <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">感谢您的注册</p>
  </div>
  <div style="padding:24px">
    <p style="font-size:15px;color:#333">${name}，您好！</p>
    <p style="font-size:15px;color:#333">感谢您注册 PortraitPay AI，您的账户已成功创建。</p>
    <p style="font-size:15px;color:#333">您可以登录后开始上传和管理您的肖像资产。</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">立即体验 →</a>
  </div>
</div>
</body>
</html>`;

    const text = `欢迎来到 PortraitPay AI\n\n${name}，您好！\n感谢您注册 PortraitPay AI，您的账户已成功创建。\n您可以登录后开始上传和管理您的肖像资产。`;

    console.log("[sendWelcomeEmail] Calling sendEmail for:", email);
    await sendEmail({
      to: email,
      subject: "欢迎来到 PortraitPay AI",
      html,
      text,
    });
    console.log("[sendWelcomeEmail] sendEmail completed for:", email);
  } catch (err) {
    // Non-blocking — log but do not throw
    console.error("[sendWelcomeEmail] failed:", err);
  }
}
