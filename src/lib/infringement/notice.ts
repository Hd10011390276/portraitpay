/**
 * Takedown Notice Template Generator
 *
 * Generates legally-styled takedown / warning / legal notices for
 * portrait rights infringement cases.
 *
 * Supports three notice types:
 *   TAKEDOWN  — "立即下架侵权内容" (standard platform notice)
 *   WARNING   — "正式警告函" (formal warning letter)
 *   LEGAL     — "律师函" (legal counsel letter)
 *
 * Templates are rendered as plain text and optionally HTML.
 * The output is stored in InfringementNotice for audit and resend capability.
 */

export type NoticeType = "TAKEDOWN" | "WARNING" | "LEGAL";

export interface NoticeTemplateData {
  /** Portrait title / name of the infringed person */
  portraitTitle: string;
  portraitOwnerName: string;
  /** Infringing content URL */
  infringingUrl: string;
  /** Date the infringement was discovered */
  detectedAt: Date;
  /** Evidence hash (SHA-256) */
  evidenceHash: string;
  /** Platform-issued certificate number (optional) */
  certificateNo?: string;
  /** IPFS CID of the evidence package (optional) */
  evidenceIpfsCid?: string;
  /** 权利人联系方式 */
  ownerContactEmail: string;
  ownerContactPhone?: string;
  /** 侵权平台名称 */
  platformName: string;
  /** 平台收件邮箱 */
  platformEmail?: string;
  /** 平台收件地址（邮寄） */
  platformAddress?: string;
  /** 证据截图 URL */
  screenshotUrl?: string;
  /** 举报编号 */
  reportId: string;
  /** 公证书编号 */
  notarizationCertNo?: string;
  /** 发函日期 */
  issuedAt: Date;
  /** 权利人签名 */
  signatureName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template renderers
// ─────────────────────────────────────────────────────────────────────────────

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日`;
}

function renderTakedownNotice(data: NoticeTemplateData): { subject: string; body: string } {
  const subject = `【侵权投诉】PortraitPay — 要求立即下架未经授权的肖像内容`;

  const body = `
PortraitPay AI 侵权投诉通知函
==============================

收件方：${data.platformName}
发件方：PortraitPay AI 平台（www.portraitpayai.com）
日  期：${formatDate(data.issuedAt)}
编  号：PP-INFRINGE-${data.reportId.slice(-8).toUpperCase()}
证据编号：${data.certificateNo ?? data.evidenceHash.slice(0, 16).toUpperCase()}

尊敬的 ${data.platformName} 管理团队：

我们是 PortraitPay AI 平台（以下简称"平台"）的运营方。
经我方监测及权利人投诉核实，发现贵平台用户上传/发布的内容涉嫌
侵犯我方平台用户的肖像权，具体情况如下：

一、涉嫌侵权内容
----------------
  侵权链接：${data.infringingUrl}
  涉及肖像：${data.portraitTitle}
  权利人  ：${data.portraitOwnerName}
  发现时间：${formatDate(data.detectedAt)}
  ${data.screenshotUrl ? `证据截图：${data.screenshotUrl}` : ""}

二、权利依据
------------
  1. 上述肖像已在 PortraitPay AI 平台完成区块链确权登记，权利人对
     该肖像享有合法的人身财产权益，受《中华人民共和国民法典》人格权
     编及相关法律法规保护。
  2. 权利人确认上述链接中的内容未经其本人授权，属于未经许可使用
     其肖像的侵权行为。

三、证据存证
------------
  证据哈希（SHA-256）：${data.evidenceHash}
  ${data.evidenceIpfsCid ? `去中心化存证（IPFS）：ipfs://${data.evidenceIpfsCid}` : ""}
  ${data.notarizationCertNo ? `公证书编号：${data.notarizationCertNo}` : ""}

四、投诉诉求
------------
  根据《信息网络传播权保护条例》及《中华人民共和国民法典》第1019条，
  我们正式要求贵平台：
  1. 立即移除/下架上述涉嫌侵权的内容；
  2. 屏蔽相关侵权链接，防止侵权内容继续传播；
  3. 如收到本函后 3 个工作日内未处理，我方将保留进一步追究的权利。

五、联系方式
------------
  权利人代理：PortraitPay AI 法务团队
  电子邮件：legal@portraitpayai.com
  ${data.ownerContactPhone ? `联系电话：${data.ownerContactPhone}` : ""}

请妥善保管本函件及附件，以备存档核查。

PortraitPay AI 平台
官方网站：www.portraitpayai.com
法务邮箱：legal@portraitpayai.com

---
本函件由 PortraitPay AI 自动生成，证据已固化存证，编号：${data.certificateNo ?? data.evidenceHash.slice(0, 16).toUpperCase()}
`.trim();

  return { subject, body };
}

function renderWarningNotice(data: NoticeTemplateData): { subject: string; body: string } {
  const subject = `【正式警告函】PortraitPay — 关于未经授权使用肖像的警告`;

  const body = `
╔══════════════════════════════════════════════════════════════╗
║           PortraitPay AI 正式警告函                           ║
║           LETTER OF FORMAL WARNING                            ║
║           编号：PP-WARNING-${data.reportId.slice(-8).toUpperCase()}               ║
╚══════════════════════════════════════════════════════════════╝

致 ${data.platformName}（收件方）：

${formatDate(data.issuedAt)}

一、发函背景
------------------------------------------------------------------
PortraitPay AI（www.portraitpayai.com）是专注于 AI 时代人脸肖像权
确权与授权的合规平台。权利人 ${data.portraitOwnerName}（身份证号已
在平台备案）已将其合法拥有的肖像在平台完成登记，登记编号见平台记录。

经我方自动监测系统及权利人主动举报，发现贵平台存在以下未经授权使用
权利人肖像的行为：

二、侵权事实
------------------------------------------------------------------
涉嫌侵权内容 URL：${data.infringingUrl}
涉及肖像名称：${data.portraitTitle}
发现时间：${formatDate(data.detectedAt)}
证据固化编号：${data.evidenceHash.slice(0, 16).toUpperCase()}
${data.notarizationCertNo ? `公证书编号：${data.notarizationCertNo}` : ""}
${data.screenshotUrl ? `证据截图：${data.screenshotUrl}` : ""}

三、法律依据
------------------------------------------------------------------
1. 《中华人民共和国民法典》第一千零一十九条：
   "任何组织或者个人不得以丑化、污损，或者利用信息技术手段伪造等
   方式侵害他人的肖像权。"
2. 《生成式人工智能服务管理暂行办法》（2023年）第四条：
   生成式人工智能服务提供者应当加强内容管理等。

四、正式警告
------------------------------------------------------------------
1. 请在收到本警告函后 **5 个工作日内** 主动联系我们，说明处理方案；
2. 请立即停止一切未经授权的肖像使用行为；
3. 如逾期未处理或继续侵权行为，我方将：
   a) 向相关监管部门正式举报；
   b) 向人民法院提起民事诉讼，主张停止侵害、消除影响、赔偿损失；
   c) 保留追究贵平台共同侵权责任的权利。

五、联系方式
------------------------------------------------------------------
代理律师 / 法务联系人：PortraitPay AI 法务部
Email：legal@portraitpayai.com
${data.platformEmail ? `指定收件邮箱：${data.platformEmail}` : ""}
${data.platformAddress ? `邮寄地址：${data.platformAddress}` : ""}

本函为正式法律文书，请妥善保管。
本函已同步上链存证，不可篡改。

此致
敬商

PortraitPay AI 法务部
${data.signatureName ?? data.portraitOwnerName}
${formatDate(data.issuedAt)}

---
自动生成编号：PP-WARNING-${data.reportId.slice(-8).toUpperCase()}
证据哈希：${data.evidenceHash}
`.trim();

  return { subject, body };
}

function renderLegalNotice(data: NoticeTemplateData): { subject: string; body: string } {
  const subject = `【律师函】PortraitPay — 正式委托律师追究肖像权侵权责任`;

  const body = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  北 京 互 联 网 法 院 协 同 保 全                             ┃
┃  PortraitPay AI — 代 理 律 师 函                             ┃
┃  案号（参考）：PP-LEGAL-${data.reportId.slice(-8).toUpperCase()}                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

发布日期：${formatDate(data.issuedAt)}
发件单位：PortraitPay AI 法务部 / 合作律所
收件方  ：${data.platformName}

═══════════════════════════════════════════════════════════════════

【律师函】

致 ${data.platformName} 负责人：

我方（以下简称"代理方"）作为肖像权人 ${data.portraitOwnerName} 的
委托代理人，就贵平台持续存在的肖像权侵权行为，正式函告如下：

一、基本事实
───────────────────────────────────────────────────────────────────
侵权页面 URL：${data.infringingUrl}
涉及肖像      ：${data.portraitTitle}
权利人        ：${data.portraitOwnerName}
首次发现时间  ：${formatDate(data.detectedAt)}
本函编号      ：PP-LEGAL-${data.reportId.slice(-8).toUpperCase()}

二、权利基础
───────────────────────────────────────────────────────────────────
${data.portraitOwnerName} 已在 PortraitPay AI 平台完成实名认证及肖像权
登记，平台确权证书编号：${data.certificateNo ?? "见平台记录"}。
其对上述肖像享有完整的人身权与财产权，受《民法典》人格权编保护。

三、侵权认定
───────────────────────────────────────────────────────────────────
贵平台用户未经权利人授权，擅自使用、传播、加工上述肖像内容，
已明确违反《民法典》第一千零一十九条及第一千零二十一条之规定，
构成对权利人肖像权的侵害。

四、我方诉求
───────────────────────────────────────────────────────────────────
请贵平台在收函后 **3个工作日** 内：
  1. 立即下架全部侵权内容；
  2. 永久屏蔽相关侵权上传入口；
  3. 向我方提供侵权用户注册信息（IP、注册手机、实名认证信息）；
  4. 书面回复处理结果至 legal@portraitpayai.com。

五、法律后果告知
───────────────────────────────────────────────────────────────────
逾期未处理者，我方将启动以下法律程序：
  • 向北京互联网法院提起民事诉讼（立案费约50元）
  • 申请诉前行为保全（紧急下架令）
  • 一并追究贵平台监管失职的共同侵权责任
  • 主张经济损失赔偿（参照授权市场价格的3倍）

六、证据保全
───────────────────────────────────────────────────────────────────
本函涉及的侵权证据已通过以下方式固化：
  • SHA-256 哈希：${data.evidenceHash}
  • ${data.evidenceIpfsCid ? `IPFS 存证：ipfs://${data.evidenceIpfsCid}` : "IPFS 存证：申请中"}
  • ${data.notarizationCertNo ? `公证文书编号：${data.notarizationCertNo}` : "公证：申请中"}

如需核实，请访问 PortraitPay AI 官网（www.portraitpayai.com）
通过举报编号 PP-INFRINGE-${data.reportId.slice(-8).toUpperCase()} 查询。

═══════════════════════════════════════════════════════════════════

代理律师：李明律师（PortraitPay AI 合作律所）
执业证号：110XXXXXXXXXXXX（示例）
代理方邮箱：legal@portraitpayai.com
官方平台：www.portraitpayai.com

PortraitPay AI 法务部 敬上
${formatDate(data.issuedAt)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
本函已同步写入区块链存证，hash: ${data.evidenceHash}
PortraitPay AI — 让每个人的肖像权在 AI 时代得到尊重与价值兑现。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

  return { subject, body };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export interface RenderedNotice {
  subject: string;
  body: string;
  type: NoticeType;
}

/**
 * Render a takedown / warning / legal notice from structured data.
 */
export function renderNotice(
  type: NoticeType,
  data: NoticeTemplateData
): RenderedNotice {
  switch (type) {
    case "TAKEDOWN":
      return { ...renderTakedownNotice(data), type };
    case "WARNING":
      return { ...renderWarningNotice(data), type };
    case "LEGAL":
      return { ...renderLegalNotice(data), type };
  }
}

/**
 * Render notice as HTML (for email sending).
 * This produces a styled HTML email body.
 */
export function renderNoticeHtml(notice: RenderedNotice, data: NoticeTemplateData): string {
  const escapedBody = notice.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${notice.subject}</title>
<style>
  body { font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
         max-width: 700px; margin: 40px auto; padding: 0 20px;
         color: #1a1a1a; line-height: 1.8; background: #f9f9f9; }
  .container { background: #fff; border: 1px solid #e0e0e0;
                border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { color: #2563eb; font-size: 20px; margin: 0 0 4px; }
  .header .subtitle { color: #666; font-size: 13px; }
  pre { white-space: pre-wrap; word-break: break-all; font-family: inherit; font-size: 14px;
        background: #f5f5f5; padding: 20px; border-radius: 6px; border: 1px solid #e0e0e0; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0;
            font-size: 12px; color: #888; text-align: center; }
  .badge { display: inline-block; background: #2563eb; color: white;
           padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>PortraitPay AI — ${type === "TAKEDOWN" ? "侵权投诉通知" : type === "WARNING" ? "正式警告函" : "律师函"}</h1>
    <div class="subtitle">编号：PP-${type}-${data.reportId.slice(-8).toUpperCase()} &nbsp;|&nbsp; ${data.platformName} &nbsp;|&nbsp; ${formatDate(data.issuedAt)}</div>
  </div>
  <pre>${escapedBody}</pre>
  <div class="footer">
    <span class="badge">证据已固化</span>
    本函由 PortraitPay AI 自动生成 | www.portraitpayai.com<br>
    证据哈希：${data.evidenceHash.slice(0, 24)}... | 如有疑问请联系 legal@portraitpayai.com
  </div>
</div>
</body>
</html>`;
}
