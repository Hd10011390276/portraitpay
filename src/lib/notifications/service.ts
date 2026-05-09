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
    title: "New Authorization Request",
    body: "An enterprise has requested to license your portrait. Please review within 24 hours.",
  },
  AUTH_APPROVED: {
    title: "Authorization Approved",
    body: "Your portrait authorization has been approved. The licensing agreement has been generated.",
  },
  AUTH_REJECTED: {
    title: "Authorization Rejected",
    body: "Unfortunately, your authorization request was not approved. Please check the rejection reason.",
  },
  AUTH_REVOKED: {
    title: "Authorization Revoked",
    body: "The portrait owner has revoked your licensing permission.",
  },
  // Earnings
  EARNING_RECEIVED: {
    title: "Earnings Received",
    body: "You have received a new payment. Check your earnings dashboard for details.",
  },
  SETTLEMENT_GENERATED: {
    title: "Monthly Settlement Generated",
    body: "Your {month} earnings settlement has been generated. Check the statement for details.",
  },
  WITHDRAWAL_APPROVED: {
    title: "Withdrawal Approved",
    body: "Your withdrawal request has been approved. Funds will arrive in 1–3 business days.",
  },
  WITHDRAWAL_REJECTED: {
    title: "Withdrawal Rejected",
    body: "Your withdrawal request was rejected. Reason: {reason}.",
  },
  // Infringement
  INFRINGEMENT_ALERT: {
    title: "Potential Infringement Detected",
    body: "System detected content that may infringe on your portrait rights. Please verify promptly.",
  },
  INFRINGEMENT_CONFIRMED: {
    title: "Infringement Confirmed",
    body: "Your confirmed infringement case — the platform has begun evidence preservation and enforcement assistance.",
  },
  // KYC
  KYC_APPROVED: {
    title: "KYC Approved",
    body: "Congratulations! Your identity verification has been approved. You now have full access to all features.",
  },
  KYC_REJECTED: {
    title: "KYC Failed",
    body: "Your identity verification was not approved. Reason: {reason}. Please resubmit.",
  },
  KYC_EXPIRED: {
    title: "KYC Expiring Soon",
    body: "Your identity verification is about to expire. Please re-verify to continue using the service.",
  },
  // System
  SYSTEM_ANNOUNCEMENT: {
    title: "System Announcement",
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
      type: type as string,
      title: title ?? resolved?.title ?? "系统通知",
      body: body ?? resolved?.body ?? "",
      data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
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
    type: input.type as string,
    title: input.title ?? TEMPLATES[input.templateKey ?? ""]?.title ?? "系统通知",
    body: input.body ?? TEMPLATES[input.templateKey ?? ""]?.body ?? "",
    data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
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
