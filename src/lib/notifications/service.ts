// Notification Service
// Handles creating, listing, and managing user notifications
// Also provides WebSocket broadcast helper (server-side reservation)

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  NotificationType,
  NotificationPayload,
} from "./types";

// ─── Notification Templates ─────────────────────────────────────────────────

const TEMPLATES: Record<string, { title: string; body: string }> = {
  // Authorization
  AUTH_APPLIED: {
    title: "新授权申请",
    body: "有企业向您申请肖像授权，请在24小时内审核。",
  },
  AUTH_APPROVED: {
    title: "授权已通过",
    body: "您的肖像授权申请已通过，授权协议已生成。",
  },
  AUTH_REJECTED: {
    title: "授权未通过",
    body: "抱歉，您的授权申请未通过，请查看拒绝原因。",
  },
  AUTH_REVOKED: {
    title: "授权已撤回",
    body: "肖像所有者撤回了授权许可。",
  },
  // Earnings
  EARNING_RECEIVED: {
    title: "收益到账",
    body: "您有一笔新的收益到账，请前往收益中心查看。",
  },
  SETTLEMENT_GENERATED: {
    title: "月度结算单已生成",
    body: "您{month}月的收益结算单已生成，请查看明细。",
  },
  WITHDRAWAL_APPROVED: {
    title: "提现申请已通过",
    body: "您的提现申请已通过，款项将在1-3个工作日内到账。",
  },
  WITHDRAWAL_REJECTED: {
    title: "提现申请被驳回",
    body: "您的提现申请被驳回，原因：{reason}。",
  },
  // Infringement
  INFRINGEMENT_ALERT: {
    title: "疑似侵权发现",
    body: "系统监测到疑似侵犯您肖像权的内容，请尽快确认。",
  },
  INFRINGEMENT_CONFIRMED: {
    title: "侵权已确认",
    body: "您确认的侵权内容，平台已开始固化证据并协助维权。",
  },
  // KYC
  KYC_APPROVED: {
    title: "KYC认证通过",
    body: "恭喜！您的身份认证已通过，现在可以使用全部功能。",
  },
  KYC_REJECTED: {
    title: "KYC认证失败",
    body: "您的身份认证未通过，原因：{reason}。请重新提交。",
  },
  KYC_EXPIRED: {
    title: "KYC认证即将过期",
    body: "您的身份认证即将过期，请及时重新认证以继续使用服务。",
  },
  // System
  SYSTEM_ANNOUNCEMENT: {
    title: "系统公告",
    body: "{message}",
  },
};

// ─── Create Notification ─────────────────────────────────────────────────────

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  templateKey?: string;
  title?: string;
  body?: string;
  data?: NotificationPayload;
  channel?: string;
  meta?: {
    ip?: string;
    userAgent?: string;
  };
};

/**
 * Create a notification for a user.
 * If templateKey is provided, title/body are resolved from TEMPLATES.
 */
export async function createNotification(input: CreateNotificationInput) {
  const { userId, type, templateKey, title, body, data, channel } = input;

  const resolved = templateKey ? TEMPLATES[templateKey] : null;

  return prisma.notification.create({
    data: {
      userId,
      type: type as Prisma.NotificationType,
      title: title ?? resolved?.title ?? "系统通知",
      body: body ?? resolved?.body ?? "",
      data: (data ?? undefined) as Record<string, unknown> | undefined,
      channel: channel ?? "IN_APP",
    },
  });
}

// ─── Batch Notify Multiple Users ─────────────────────────────────────────────

export async function createBulkNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">
) {
  const records = userIds.map((userId) => ({
    userId,
    type: input.type as Prisma.NotificationType,
    title: input.title ?? TEMPLATES[input.templateKey ?? ""]?.title ?? "系统通知",
    body: input.body ?? TEMPLATES[input.templateKey ?? ""]?.body ?? "",
    data: (input.data ?? undefined) as Record<string, unknown> | undefined,
    channel: input.channel ?? "IN_APP",
  }));

  return prisma.notification.createMany({ data: records });
}

// ─── List Notifications ──────────────────────────────────────────────────────

export type ListNotificationsOptions = {
  userId: string;
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
};

export async function listNotifications(options: ListNotificationsOptions) {
  const { userId, page = 1, limit = 20, isRead, type } = options;

  const where: Record<string, unknown> = { userId };
  if (typeof isRead === "boolean") where.isRead = isRead;
  if (type) where.type = type;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Mark Single Notification as Read ───────────────────────────────────────

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

// ─── Mark All as Read ─────────────────────────────────────────────────────────

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// ─── Unread Count ────────────────────────────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

// ─── Delete Old Notifications (cleanup) ─────────────────────────────────────

/**
 * Delete notifications older than `days` days.
 * Returns count of deleted records.
 */
export async function pruneOldNotifications(userId: string, days = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      isRead: true,
      createdAt: { lt: cutoff },
    },
  });

  return result.count;
}

// ─── WebSocket Broadcast Helper ─────────────────────────────────────────────
// This is a server-side stub for WebSocket push.
// In production, integrate with Socket.IO or SSE endpoint.
// The client can subscribe via /api/v1/notifications/stream (SSE) or WS.

// Returns the notification record for the caller to emit via WebSocket.
export async function createAndBroadcast(input: CreateNotificationInput) {
  const notification = await createNotification(input);
  return notification;
}
