// User Audit Log Service
// Records user-side operation audit trail (login, profile change, authorization, etc.)

import { prisma } from "@/lib/prisma";
import type { UserAuditAction } from "@prisma/client";
import { headers } from "next/headers";

export type AuditMeta = {
  ip?: string | null;
  userAgent?: string | null;
  deviceType?: string;
  browser?: string;
  os?: string;
  errorCode?: string;
  [key: string]: unknown;
};

// ─── Log a User Action ───────────────────────────────────────────────────────

export type LogAuditInput = {
  userId: string;
  action: UserAuditAction;
  targetType?: string;
  targetId?: string;
  success?: boolean;
  detail?: string;
  meta?: AuditMeta;
};

/**
 * Record a user audit log entry.
 * Call this at the end of every significant user action handler.
 */
export async function logAudit(input: LogAuditInput) {
  const { userId, action, targetType, targetId, success = true, detail, meta } = input;

  // Try to extract IP and User-Agent from headers if not provided
  let ip = meta?.ip;
  let userAgent = meta?.userAgent;

  if (!ip || !userAgent) {
    try {
      const headersList = await headers();
      ip = ip ?? headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? headersList.get("x-real-ip") ?? null;
      userAgent = userAgent ?? headersList.get("user-agent") ?? null;
    } catch {
      // Headers not available in this context
    }
  }

  return prisma.userAuditLog.create({
    data: {
      userId,
      action,
      targetType,
      targetId,
      success,
      detail,
      ipAddress: ip ?? null,
      userAgent: userAgent ?? null,
      meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
    },
  });
}

// ─── List Audit Logs (for user or admin) ─────────────────────────────────────

export type ListAuditLogsOptions = {
  userId?: string;
  action?: UserAuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  success?: boolean;
};

export async function listAuditLogs(options: ListAuditLogsOptions) {
  const {
    userId,
    action,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    success,
  } = options;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (typeof success === "boolean") where.success = success;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.userAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.userAuditLog.count({ where }),
  ]);

  return {
    logs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Admin: List All Audit Logs ─────────────────────────────────────────────

export type AdminListAuditLogsOptions = {
  action?: UserAuditAction;
  userId?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  success?: boolean;
};

export async function adminListAuditLogs(options: AdminListAuditLogsOptions) {
  const {
    action,
    userId,
    targetType,
    targetId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    success,
  } = options;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;
  if (typeof success === "boolean") where.success = success;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.userAuditLog.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, displayName: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.userAuditLog.count({ where }),
  ]);

  return {
    logs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Audit Action Descriptions (human-readable) ─────────────────────────────

export const AUDIT_ACTION_LABELS: Record<UserAuditAction, string> = {
  LOGIN: "用户登录",
  LOGIN_FAILED: "登录失败",
  LOGOUT: "用户登出",
  OTP_SENT: "发送验证码",
  OTP_VERIFIED: "验证码验证成功",
  OTP_FAILED: "验证码验证失败",
  PROFILE_UPDATE: "更新个人资料",
  PHONE_BIND: "绑定手机号",
  PHONE_UNBIND: "解绑手机号",
  WALLET_BIND: "绑定钱包",
  WALLET_UNBIND: "解绑钱包",
  KYC_SUBMITTED: "提交KYC认证",
  KYC_APPROVED: "KYC认证通过",
  KYC_REJECTED: "KYC认证拒绝",
  KYC_EXPIRED: "KYC认证过期",
  PORTRAIT_REGISTERED: "登记肖像",
  PORTRAIT_UPDATED: "更新肖像信息",
  PORTRAIT_SUSPENDED: "肖像被暂停",
  PORTRAIT_DELETED: "删除肖像",
  AUTH_REQUEST_SENT: "发起授权申请",
  AUTH_APPROVED: "授权通过",
  AUTH_REJECTED: "授权拒绝",
  AUTH_REVOKED: "授权撤回",
  AUTH_CERTIFICATE_DOWNLOADED: "下载授权证书",
  EARNINGS_WITHDRAWN: "收益提现",
  EARNINGS_EXPORTED: "导出收益报告",
  SETTLEMENT_VIEWED: "查看结算单",
  NOTIFICATION_SETTINGS_UPDATED: "更新通知设置",
  MONITOR_CONFIG_UPDATED: "更新监测配置",
  API_KEY_CREATED: "创建API Key",
  API_KEY_DELETED: "删除API Key",
  API_KEY_ROTATED: "轮换API Key",
};
