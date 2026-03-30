/**
 * Infringement Notifications
 *
 * Sends alert notifications to portrait owners when potential infringement is detected.
 * Supports: Email (Resend), SMS (预留), WeChat Official Account (预留).
 *
 * High-priority alerts (similarity > 0.95) bypass quiet hours.
 */

import { prisma } from "@/lib/prisma";

interface AlertEmailParams {
  ownerEmail: string;
  ownerName: string;
  portraitTitle: string;
  alertId: string;
  similarityScore: number;
  infringingUrl: string;
  platform: string;
  screenshotUrl?: string;
}

/**
 * Send infringement alert email to the portrait owner.
 * Uses Resend API (same as transaction notifications per SPEC.md).
 *
 * STUB — replace with actual Resend API call.
 */
export async function sendInfringementAlertEmail(params: AlertEmailParams): Promise<void> {
  const {
    ownerEmail,
    ownerName,
    portraitTitle,
    alertId,
    similarityScore,
    infringingUrl,
    platform,
    screenshotUrl,
  } = params;

  const similarityPercent = (similarityScore * 100).toFixed(1);
  const isHighPriority = similarityScore >= 0.95;

  // Check owner's notification preferences
  const config = await prisma.infringementMonitorConfig.findUnique({
    where: { userId: (await getUserIdByEmail(ownerEmail)) ?? "" },
  });

  if (config && !config.notifyEmail) {
    console.log(`[Notify] Email notifications disabled for owner ${ownerEmail}. Skipping.`);
    return;
  }

  // Check quiet hours (high priority bypasses)
  if (config && !isHighPriority && isInQuietHours(config.quietHoursStart ?? "22:00", config.quietHoursEnd ?? "08:00")) {
    console.log(`[Notify] Quiet hours active for ${ownerEmail}. Deferring notification.`);
    return;
  }

  // STUB — real implementation uses Resend:
  // const { data, error } = await resend.emails.send({
  //   from: "PortraitPay <alerts@portraitpayai.com>",
  //   to: ownerEmail,
  //   subject: `[PortraitPay] ⚠️ 侵权告警 — ${portraitTitle} 在 ${platform} 发现疑似侵权`,
  //   html: renderAlertEmailHtml({ ... }),
  // });
  // if (error) throw error;

  console.log(`[Notify] STUB — would send infringement alert email to ${ownerEmail}`);
  console.log(`  Portrait: ${portraitTitle}`);
  console.log(`  Platform: ${platform} | Similarity: ${similarityPercent}%`);
  console.log(`  URL: ${infringingUrl}`);
  if (screenshotUrl) console.log(`  Screenshot: ${screenshotUrl}`);
  console.log(`  Alert ID: ${alertId}`);
}

async function getUserIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

function isInQuietHours(start: string, end: string): boolean {
  const now = new Date();
  const currentHour = now.getUTCHours() + 8; // Asia/Shanghai

  const [startHour] = start.split(":").map(Number);
  const [endHour] = end.split(":").map(Number);

  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour < endHour;
  } else {
    // Quiet hours span midnight (e.g., 22:00 - 08:00)
    return currentHour >= startHour || currentHour < endHour;
  }
}

/**
 * Send SMS alert (stub — integrate with Alibaba Cloud / Twilio).
 */
export async function sendInfringementAlertSms(_params: AlertEmailParams): Promise<void> {
  // STUB
  console.warn("[Notify] SMS notification stub called");
}

/**
 * Send WeChat Official Account template message (stub).
 */
export async function sendInfringementAlertWechat(_params: AlertEmailParams): Promise<void> {
  // STUB — integrate with 微信服务号模板消息 API
  // POST https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=ACCESS_TOKEN
  console.warn("[Notify] WeChat notification stub called");
}
