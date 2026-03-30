/**
 * Email utility — SendGrid / Alibaba Cloud Mail
 * 邮件发送工具，支持 SendGrid 和阿里云邮件推送
 *
 * 环境变量配置:
 * - SENDGRID_API_KEY / ALIYUN_ACCESS_KEY / ALIYUN_ACCESS_SECRET
 * - EMAIL_FROM / EMAIL_FROM_NAME
 * - ADMIN_EMAIL (通知收件人)
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface ContactEmailData {
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  type: "GENERAL" | "ENTERPRISE";
  // Enterprise extra
  enterpriseName?: string;
  intendedUse?: string;
  expectedScale?: string;
  contactPhone?: string;
}

// ============================================================
// SendGrid adapter
// ============================================================
async function sendViaSendGrid(opts: EmailOptions): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY not configured");

  const from = process.env.EMAIL_FROM ?? "noreply@portraitpayai.com";
  const fromName = process.env.EMAIL_FROM_NAME ?? "PortraitPay AI";

  const body = {
    personalizations: [
      {
        to: (Array.isArray(opts.to) ? opts.to : [opts.to]).map((t) => ({ email: t })),
        subject: opts.subject,
      },
    ],
    from: { email: from, name: fromName },
    content: [
      { type: "text/plain", value: opts.text ?? opts.html.replace(/<[^>]+>/g, "") },
      { type: "text/html", value: opts.html },
    ],
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok && res.status !== 200 && res.status !== 202) {
    const text = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${text}`);
  }
}

// ============================================================
// Alibaba Cloud Mail adapter
// ============================================================
async function sendViaAliyun(opts: EmailOptions): Promise<void> {
  const accessKey = process.env.ALIYUN_ACCESS_KEY;
  const accessSecret = process.env.ALIYUN_ACCESS_SECRET;
  if (!accessKey || !accessSecret) throw new Error("Aliyun credentials not configured");

  // Simple DirectMail API call — in production use @alicloud/dm SDK
  const accountName = process.env.ALIYUN_MAIL_ACCOUNT ?? process.env.EMAIL_FROM;
  const region = process.env.ALIYUN_MAIL_REGION ?? "cn-hangzhou";

  const payload = {
    AccountName: accountName,
    AddressType: 1,
    ToAddress: Array.isArray(opts.to) ? opts.to.join(",") : opts.to,
    Subject: opts.subject,
    HtmlBody: opts.html,
    TextBody: opts.text ?? opts.html.replace(/<[^>]+>/g, ""),
  };

  // Sign request with Aliyun OpenAPI (simplified — use SDK in production)
  const endpoint = `https://dm.${region}.aliyuncs.com`;
  const res = await fetch(`${endpoint}/singleapi/mail/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Auth-Version": "2017-06-22",
      // Note: in production, sign with Aliyun_ROARequest or use SDK
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Aliyun Mail error ${res.status}: ${text}`);
  }
}

// ============================================================
// Contact notification HTML template
// ============================================================
function buildContactNotificationEmail(data: ContactEmailData): { subject: string; html: string; text: string } {
  const isEnterprise = data.type === "ENTERPRISE";
  const subject = isEnterprise
    ? `【企业入驻咨询】${data.name} - ${data.enterpriseName ?? data.company ?? ""}`
    : `【联系表单】${data.name} - ${data.subject ?? ""}`;

  const rows = [
    ["姓名", data.name],
    ["邮箱", data.email],
    ["公司", data.company ?? "—"],
    ...(isEnterprise
      ? [
          ["企业名称", data.enterpriseName ?? "—"],
          ["联系电话", data.contactPhone ?? "—"],
          ["预期规模", data.expectedScale ?? "—"],
          ["用途说明", data.intendedUse ?? "—"],
        ]
      : []),
    ["留言内容", data.message],
  ]
    .map(([k, v]) => `<tr><td style="padding:8px 12px;font-weight:bold;color:#666;white-space:nowrap">${k}</td><td style="padding:8px 12px">${v}</td></tr>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#7c3aed;padding:20px 24px">
    <h2 style="margin:0;color:#fff;font-size:18px">${isEnterprise ? "🏢 企业入驻咨询" : "📋 联系表单通知"}</h2>
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
    `${isEnterprise ? "企业入驻咨询" : "联系表单通知"}`,
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
  const provider = process.env.EMAIL_PROVIDER ?? "sendgrid";

  if (provider === "aliyun") {
    await sendViaAliyun(opts);
  } else {
    await sendViaSendGrid(opts);
  }
}

export async function sendContactNotification(data: ContactEmailData): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@portraitpayai.com";
  const { subject, html, text } = buildContactNotificationEmail(data);

  await sendEmail({
    to: adminEmail,
    subject,
    html,
    text,
  });
}
