/**
 * Audit Service - minimal stub for auth/api-keys dependencies
 */

import { prisma } from "@/lib/prisma";
import type { UserAuditAction } from "@/types/enums";

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: "Login",
  LOGIN_FAILED: "Login Failed",
  LOGOUT: "Logout",
  REGISTER: "Registration",
  API_KEY_CREATED: "API Key Created",
  API_KEY_DELETED: "API Key Deleted",
  PORTRAIT_UPLOADED: "Portrait Uploaded",
  PORTRAIT_CERTIFIED: "Portrait Certified",
};

interface LogAuditParams {
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  success?: boolean;
  detail?: string;
  meta?: Record<string, unknown>;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action as UserAuditAction,
        targetType: params.targetType,
        targetId: params.targetId,
        success: params.success ?? true,
        detail: params.detail,
        meta: params.meta,
      },
    });
  } catch (error) {
    console.error("[logAudit]", error);
  }
}

interface AdminListAuditLogsParams {
  action?: string;
  userId?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  success?: boolean;
}

export async function adminListAuditLogs(params: AdminListAuditLogsParams) {
  const where: Record<string, unknown> = {};

  if (params.action) where.action = params.action;
  if (params.userId) where.userId = params.userId;
  if (params.targetType) where.targetType = params.targetType;
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) (where.createdAt as Record<string, Date>).gte = params.startDate;
    if (params.endDate) (where.createdAt as Record<string, Date>).lte = params.endDate;
  }
  if (typeof params.success === "boolean") where.success = params.success;

  const skip = (params.page - 1) * params.limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: params.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}