// Notification type definitions

export type NotificationType =
  | "SYSTEM"
  | "AUTHORIZATION"
  | "EARNING"
  | "INFRINGEMENT"
  | "KYC"
  | "SETTLEMENT"
  | "WITHDRAWAL";

export type NotificationChannel = "IN_APP" | "WEBSOCKET" | "EMAIL" | "SMS";

// Plain JSON-serialisable object (compatible with Prisma Json field)
export type NotificationPayload = Record<string, string | number | boolean | null | undefined>;

export type NotificationMeta = {
  ip?: string;
  userAgent?: string;
};
