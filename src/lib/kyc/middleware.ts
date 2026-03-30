/**
 * KYC 中间件守卫
 *
 * 用于在 API Route 中快速检查 KYC 状态
 */

import { prisma } from "@/lib/prisma";

export type KYCGuardLevel = 0 | 1 | 2 | 3;

/**
 * KYC 守卫结果
 */
export interface KYCGuardResult {
  allowed: boolean;
  status: string;
  reason?: string;
}

/**
 * 检查用户 KYC 级别是否满足最低要求
 *
 * @param userId  用户 ID
 * @param minLevel 最低需要的 KYC 级别
 *
 * 级别定义：
 *   0 — 无 KYC
 *   1 — 基础认证（手机+邮箱）
 *   2 — 身份证核验（Level 2 KYC）
 *   3 — 增强尽调（Level 3 KYC）
 */
export async function checkKYC(
  userId: string,
  minLevel: KYCGuardLevel = 2
): Promise<KYCGuardResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, kycLevel: true, kycExpiredAt: true, role: true },
  });

  if (!user) {
    return { allowed: false, status: "NOT_FOUND", reason: "用户不存在" };
  }

  // ADMIN / VERIFIER 不受 KYC 限制
  if (user.role === "ADMIN" || user.role === "VERIFIER") {
    return { allowed: true, status: "ADMIN_EXEMPT" };
  }

  // CELEBRITY 角色必须有 Level 2+
  if (user.role === "CELEBRITY" && user.kycLevel < 2) {
    return { allowed: false, status: user.kycStatus, reason: "名人需完成身份认证" };
  }

  // 检查 KYC 级别
  if (user.kycLevel < minLevel) {
    return {
      allowed: false,
      status: user.kycStatus,
      reason: `需要 KYC Level ${minLevel}，当前 ${user.kycLevel}`,
    };
  }

  // 检查 KYC 状态
  if (user.kycStatus === "REJECTED") {
    return { allowed: false, status: "REJECTED", reason: "身份认证被拒绝，请重新申请" };
  }

  if (user.kycStatus === "EXPIRED") {
    return { allowed: false, status: "EXPIRED", reason: "身份认证已过期，请重新认证" };
  }

  if (user.kycStatus === "PENDING") {
    return { allowed: false, status: "PENDING", reason: "身份认证审核中，请等待" };
  }

  if (user.kycStatus === "NOT_STARTED") {
    return { allowed: false, status: "NOT_STARTED", reason: "请先完成身份认证" };
  }

  // APPROVED — 检查过期
  if (user.kycExpiredAt && user.kycExpiredAt < new Date()) {
    return { allowed: false, status: "EXPIRED", reason: "身份认证已过期，请重新认证" };
  }

  return { allowed: true, status: "APPROVED" };
}

/**
 * 生成错误响应（用于 API Route 中）
 */
export function kycDeniedResponse(result: KYCGuardResult): Response {
  const codeMap: Record<string, number> = {
    NOT_FOUND: 404,
    NOT_STARTED: 403,
    PENDING: 403,
    REJECTED: 403,
    EXPIRED: 403,
  };

  return Response.json(
    {
      success: false,
      error: result.reason ?? "KYC verification required",
      code: "PP-2001",
      status: result.status,
    },
    { status: codeMap[result.status] ?? 403 }
  );
}

/**
 * 辅助函数：在 API Route 中使用守卫
 *
 * 用法：
 *   const guard = await requireKYC(session.user.id, 2);
 *   if (!guard.allowed) return kycDeniedResponse(guard);
 */
export async function requireKYC(
  userId: string,
  minLevel: KYCGuardLevel = 2
): Promise<KYCGuardResult> {
  return checkKYC(userId, minLevel);
}
