/**
 * KYC Service — 核心业务逻辑层
 *
 * 职责：
 * 1. 统一调度第三方 KYC 提供商（阿里云/腾讯云）
 * 2. 管理 KYC 状态机
 * 3. 处理 Webhook 回调
 * 4. 写入 KYCLog 审计日志
 * 5. 处理艺人/名人专项通道
 */

import { prisma } from "@/lib/prisma";
import { AliyunKYCProvider } from "./providers/aliyun";
import { TencentKYCProvider } from "./providers/tencent";
import type {
  KYCProvider,
  KYCProviderClient,
  KYCLevel,
  KYCState,
  KYCInitResponse,
  KYCSubmitPayload,
  KYCStatusResponse,
  CelebrityApplicationPayload,
  IDCardOCRResult,
  FaceVerifyResult,
} from "./types";
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ============================================================
// 提供商工厂
// ============================================================

function createKYCProvider(): KYCProviderClient {
  const provider = (process.env.KYC_PROVIDER ?? "aliyun") as KYCProvider;

  switch (provider) {
    case "aliyun":
      return new AliyunKYCProvider({
        accessKeyId: process.env.KYC_ALIYUN_ACCESS_KEY_ID ?? "",
        accessKeySecret: process.env.KYC_ALIYUN_ACCESS_KEY_SECRET ?? "",
        appId: process.env.KYC_ALIYUN_APP_ID ?? "",
        region: process.env.KYC_ALIYUN_REGION,
      });
    case "tencent":
      return new TencentKYCProvider({
        secretId: process.env.KYC_TENCENT_SECRET_ID ?? "",
        secretKey: process.env.KYC_TENCENT_SECRET_KEY ?? "",
        appId: process.env.KYC_TENCENT_APP_ID ?? "",
        region: process.env.KYC_TENCENT_REGION,
      });
    default:
      throw new Error(`Unsupported KYC provider: ${provider}`);
  }
}

// ============================================================
// 辅助函数
// ============================================================

/** 脱敏身份证号 */
function maskIdCard(idCard: string): string {
  if (idCard.length < 8) return "****";
  return idCard.slice(0, 4) + "****" + idCard.slice(-4);
}

/** 写入 KYC 日志 */
async function writeKYLog(data: {
  userId: string;
  provider: string;
  action: string;
  level: number;
  externalRef?: string;
  ocrResult?: IDCardOCRResult;
  faceResult?: FaceVerifyResult;
  rejectReason?: string;
  verifierId?: string;
}) {
  return prisma.kYCLog.create({
    data: {
      userId: data.userId,
      provider: data.provider,
      externalRef: data.externalRef,
      action: data.action,
      level: data.level,
      idCardNumber: data.ocrResult ? maskIdCard(data.ocrResult.idCardNumber) : null,
      idCardName: data.ocrResult ? data.ocrResult.name : null,
      idCardAddress: data.ocrResult ? data.ocrResult.address.slice(0, 20) + "..." : null,
      idCardExpire: data.ocrResult?.expireDate ?? null,
      faceMatchScore: data.faceResult?.verifyScore ?? null,
      ocrRawData: data.ocrResult ?? undefined,
      faceRawData: data.faceResult ?? undefined,
      rejectReason: data.rejectReason ?? null,
      verifierId: data.verifierId ?? null,
    },
  });
}

/** 判断 KYC 是否过期（默认 12 个月） */
function isKYCExpired(expiredAt: Date | null): boolean {
  if (!expiredAt) return false;
  return expiredAt < new Date();
}

// ============================================================
// KYC 服务
// ============================================================

export class KYCService {
  private provider: KYCProviderClient;

  constructor() {
    this.provider = createKYCProvider();
  }

  // ─── 1. 初始化 KYC 会话 ─────────────────────────────────────

  /**
   * POST /api/v1/kyc/init
   * 返回第三方认证跳转 URL
   */
  async init(userId: string, level: KYCLevel): Promise<KYCInitResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // 已认证且未过期，不可重复初始化
    if (user.kycStatus === "APPROVED" && !isKYCExpired(user.kycExpiredAt)) {
      throw new Error("KYC already approved");
    }

    const providerName = process.env.KYC_PROVIDER ?? "aliyun";
    const { sessionToken, redirectUrl, externalRef } =
      await this.provider.initSession(userId, level);

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycProviderRef: externalRef,
        // 重新初始化 → 状态回 PENDING
        kycStatus: "PENDING",
        kycLevel: level,
      },
    });

    await writeKYLog({
      userId,
      provider: providerName,
      action: "init",
      level,
      externalRef,
    });

    return {
      sessionToken,
      redirectUrl,
      expireAt: addMonths(new Date(), 1).toISOString(),
    };
  }

  // ─── 2. 提交 KYC 资料（前端拍照后上传） ───────────────────────

  /**
   * POST /api/v1/kyc/submit
   * 用户上传身份证照片 + 人脸照 → 触发 OCR + 人脸核身
   */
  async submit(userId: string, payload: KYCSubmitPayload): Promise<void> {
    const providerName = process.env.KYC_PROVIDER ?? "aliyun";
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // Level 2 必须有身份证照片
    if (payload.level >= 2) {
      if (!payload.idCardFrontUrl) {
        throw new Error("idCardFrontUrl is required for level 2+");
      }
    }

    let ocrResult: IDCardOCRResult | undefined;
    let faceResult: FaceVerifyResult | undefined;

    // 1) OCR 识别
    if (payload.idCardFrontUrl) {
      try {
        ocrResult = await this.provider.submitOCR(
          payload.idCardFrontUrl,
          payload.idCardBackUrl ?? payload.idCardFrontUrl
        );
        await writeKYLog({
          userId,
          provider: providerName,
          action: "ocr_result",
          level: payload.level,
          externalRef: user.kycProviderRef ?? undefined,
          ocrResult,
        });
      } catch (err) {
        console.error("[KYC] OCR failed:", err);
        throw new Error("OCR识别失败，请重新上传清晰的身份证照片");
      }
    }

    // 2) 人脸核身（1:1 对比）
    if (payload.faceImageUrl && ocrResult) {
      try {
        faceResult = await this.provider.submitFaceVerify(
          payload.faceImageUrl,
          ocrResult.idCardNumber
        );
        await writeKYLog({
          userId,
          provider: providerName,
          action: "face_verify",
          level: payload.level,
          externalRef: user.kycProviderRef ?? undefined,
          faceResult,
        });

        // 活体或对照分数不达标 → 直接拒绝
        if (faceResult.verifyResult === "FAIL" || faceResult.livenessResult === "FAIL") {
          await this.reject(
            userId,
            `人脸核身未通过（对照分数${faceResult.verifyScore}，活体${faceResult.livenessScore}）`,
            undefined,
            payload.level
          );
          return;
        }
      } catch (err) {
        console.error("[KYC] FaceVerify failed:", err);
        throw new Error("人脸核身失败，请确保光线充足且正对摄像头");
      }
    }

    // 3) 提交成功 → 状态更新
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "PENDING" },
    });

    await writeKYLog({
      userId,
      provider: providerName,
      action: "submit",
      level: payload.level,
      externalRef: user.kycProviderRef ?? undefined,
    });
  }

  // ─── 3. 查询 KYC 状态 ───────────────────────────────────────

  /**
   * GET /api/v1/kyc/status
   */
  async getStatus(userId: string): Promise<KYCStatusResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    let status: KYCState = user.kycStatus;

    // 检查是否过期
    if (status === "APPROVED" && isKYCExpired(user.kycExpiredAt)) {
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "EXPIRED" },
      });
      status = "EXPIRED";
    }

    // 艺人专项申请状态
    let celebrityStatus: "PENDING" | "APPROVED" | "REJECTED" | null = null;
    if (user.role === "CELEBRITY") {
      const app = await prisma.celebrityApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (app) celebrityStatus = app.status as "PENDING" | "APPROVED" | "REJECTED";
    }

    return {
      status,
      level: user.kycLevel,
      verifiedAt: user.kycVerifiedAt?.toISOString() ?? null,
      expiredAt: user.kycExpiredAt?.toISOString() ?? null,
      provider: user.kycProviderRef ? (process.env.KYC_PROVIDER ?? "aliyun") : null,
      celebrityStatus: user.role === "CELEBRITY" ? celebrityStatus : undefined,
    };
  }

  // ─── 4. 处理第三方 Webhook 回调 ──────────────────────────────

  /**
   * POST /api/v1/kyc/webhook
   */
  async handleWebhook(
    providerName: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const { userId, status, externalRef, result } =
      await this.provider.handleWebhook(payload);

    const kycLevel = (payload["level"] as number) ?? 2;

    await writeKYLog({
      userId,
      provider: providerName,
      action: "webhook",
      level: kycLevel,
      externalRef,
    });

    if (status === "APPROVED") {
      await this.approve(userId, externalRef ?? undefined, kycLevel);
    } else if (status === "REJECTED") {
      await this.reject(
        userId,
        (payload["reason"] as string) ?? "第三方审核未通过",
        externalRef ?? undefined,
        kycLevel
      );
    } else {
      // PENDING — 继续等待
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "PENDING", kycProviderRef: externalRef ?? undefined },
      });
    }
  }

  // ─── 5. 人工审核通过 ─────────────────────────────────────────

  async approve(
    userId: string,
    externalRef?: string,
    level: number = 2
  ): Promise<void> {
    const now = new Date();
    const expiredAt = addMonths(now, 12); // 12 个月有效期

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: "APPROVED",
        kycVerifiedAt: now,
        kycExpiredAt: expiredAt,
        kycProviderRef: externalRef ?? undefined,
        kycLevel: level,
      },
    });

    await writeKYLog({
      userId,
      provider: process.env.KYC_PROVIDER ?? "aliyun",
      action: "approve",
      level,
      externalRef,
    });
  }

  // ─── 6. 人工审核拒绝 ─────────────────────────────────────────

  async reject(
    userId: string,
    reason: string,
    externalRef?: string,
    level: number = 2,
    verifierId?: string
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: "REJECTED",
        kycProviderRef: externalRef ?? undefined,
      },
    });

    await writeKYLog({
      userId,
      provider: process.env.KYC_PROVIDER ?? "aliyun",
      action: "reject",
      level,
      externalRef,
      rejectReason: reason,
      verifierId,
    });
  }

  // ─── 7. 获取 KYC 日志（管理员） ───────────────────────────────

  async getLogs(
    userId: string,
    opts?: { page?: number; limit?: number }
  ): Promise<{ logs: unknown[]; total: number }> {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.kYCLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          provider: true,
          action: true,
          level: true,
          idCardName: true,
          idCardExpire: true,
          faceMatchScore: true,
          rejectReason: true,
          verifierId: true,
          createdAt: true,
        },
      }),
      prisma.kYCLog.count({ where: { userId } }),
    ]);

    return { logs, total };
  }

  // ─── 8. 艺人专项申请 ─────────────────────────────────────────

  async submitCelebrityApplication(
    userId: string,
    payload: CelebrityApplicationPayload
  ): Promise<void> {
    // 授权书文件哈希校验（可选）
    if (payload.authLetterHash) {
      // 可以在此验证哈希是否合法
    }

    const existing = await prisma.celebrityApplication.findFirst({
      where: { userId, status: "PENDING" },
    });
    if (existing) {
      throw new Error("已有待审核的艺人申请，请等待审核结果");
    }

    await prisma.celebrityApplication.create({
      data: {
        userId,
        stageName: payload.stageName,
        realName: payload.realName,
        idCardNumber: payload.idCardNumber,
        idCardFrontUrl: payload.idCardFrontUrl,
        idCardBackUrl: payload.idCardBackUrl,
        authLetterUrl: payload.authLetterUrl,
        authLetterHash: payload.authLetterHash,
        notaryCertUrl: payload.notaryCertUrl,
        agencyName: payload.agencyName,
        agencyContact: payload.agencyContact,
        agencyPhone: payload.agencyPhone,
        status: "PENDING",
      },
    });

    // 申请提交后，需要先完成 Level 2 KYC 才能最终审批
    if (![2, 3].includes(await this.getTargetKYCLevel(userId))) {
      // 标记用户角色为待审核名人
    }
  }

  async reviewCelebrityApplication(
    applicationId: string,
    reviewerId: string,
    decision: "APPROVED" | "REJECTED",
    reason?: string
  ): Promise<void> {
    const app = await prisma.celebrityApplication.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new Error("Application not found");

    await prisma.celebrityApplication.update({
      where: { id: applicationId },
      data: {
        status: decision,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
    });

    if (decision === "APPROVED") {
      await prisma.user.update({
        where: { id: app.userId },
        data: { role: "CELEBRITY" },
      });
    }
  }

  // ─── 9. KYC 强制重置（管理员） ───────────────────────────────

  async resetKYC(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: "NOT_STARTED",
        kycLevel: 0,
        kycProviderRef: null,
        kycVerifiedAt: null,
        kycExpiredAt: null,
      },
    });
  }

  // ─── 10. 批量过期检查（定时任务） ───────────────────────────

  async checkExpired(): Promise<number> {
    const now = new Date();
    const result = await prisma.user.updateMany({
      where: {
        kycStatus: "APPROVED",
        kycExpiredAt: { lt: now },
      },
      data: { kycStatus: "EXPIRED" },
    });

    // 写日志
    const expiredUsers = await prisma.user.findMany({
      where: {
        kycStatus: "EXPIRED",
        kycExpiredAt: { lt: now },
      },
      select: { id: true, kycLevel: true },
    });

    for (const u of expiredUsers) {
      await writeKYLog({
        userId: u.id,
        provider: "internal",
        action: "expire_check",
        level: u.kycLevel,
      });
    }

    return result.count;
  }

  // ─── 辅助 ───────────────────────────────────────────────────

  private async getTargetKYCLevel(userId: string): Promise<number> {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { kycLevel: true } });
    return u?.kycLevel ?? 0;
  }
}

// ============================================================
// 导出单例
// ============================================================

export const kycService = new KYCService();
