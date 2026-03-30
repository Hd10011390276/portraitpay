/**
 * Enterprise Authorization Service
 * 企业授权申请、审批工作流
 */
import { prisma } from "@/lib/prisma";
import { EntAuthStatus, LicenseType } from "@prisma/client";
import { addDays } from "date-fns";
import { generateAuthorizationContract } from "./contract";
import { generateCertificatePDF } from "./certificate";

export interface EnterpriseAuthApplicationInput {
  enterpriseId: string;
  portraitId: string;
  purpose: string;
  usageScope: string[];
  exclusivity?: boolean;
  territorialScope?: string;
  usageDuration: number; // 天数
  proposedFee: number;
  currency?: string;
}

function generateCertNo(): string {
  const prefix = "PPA";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * 发起企业授权申请
 */
export async function createEnterpriseAuthApplication(
  applicantUserId: string,
  input: EnterpriseAuthApplicationInput
) {
  // 验证企业身份
  const enterprise = await prisma.enterprise.findUnique({
    where: { id: input.enterpriseId },
  });
  if (!enterprise) throw new Error("企业不存在");
  if (enterprise.status !== "APPROVED") throw new Error("企业未通过认证");

  // 验证肖像存在且状态正常
  const portrait = await prisma.portrait.findUnique({
    where: { id: input.portraitId },
  });
  if (!portrait) throw new Error("肖像不存在");
  if (portrait.status !== "ACTIVE") throw new Error("该肖像暂不可申请授权");

  // 检查是否有进行中的申请
  const existingApplication = await prisma.entAuthApplication.findFirst({
    where: {
      enterpriseId: input.enterpriseId,
      portraitId: input.portraitId,
      status: { in: ["PENDING_PORTRAIT_OWNER", "PENDING_PLATFORM_REVIEW"] },
    },
  });
  if (existingApplication) throw new Error("已有进行中的授权申请，请等待处理");

  const application = await prisma.entAuthApplication.create({
    data: {
      enterpriseId: input.enterpriseId,
      portraitId: input.portraitId,
      purpose: input.purpose,
      usageScope: input.usageScope,
      exclusivity: input.exclusivity ?? false,
      territorialScope: input.territorialScope ?? "global",
      usageDuration: input.usageDuration,
      proposedFee: input.proposedFee,
      currency: input.currency ?? "CNY",
      status: EntAuthStatus.PENDING_PORTRAIT_OWNER,
    },
  });

  return application;
}

/**
 * 肖像所有者确认授权申请
 */
export async function confirmByPortraitOwner(applicationId: string, ownerId: string) {
  const application = await prisma.entAuthApplication.findUnique({
    where: { id: applicationId },
    include: { portrait: true },
  });
  if (!application) throw new Error("申请不存在");
  if (application.portrait.ownerId !== ownerId) throw new Error("您不是该肖像的所有者");
  if (application.status !== EntAuthStatus.PENDING_PORTRAIT_OWNER) {
    throw new Error("当前状态不允许此操作");
  }

  return prisma.entAuthApplication.update({
    where: { id: applicationId },
    data: {
      status: EntAuthStatus.PENDING_PLATFORM_REVIEW,
      portraitOwnerConfirmed: true,
      portraitOwnerConfirmedAt: new Date(),
    },
  });
}

/**
 * 拒绝授权申请（肖像所有者）
 */
export async function rejectByPortraitOwner(applicationId: string, ownerId: string, reason?: string) {
  const application = await prisma.entAuthApplication.findUnique({
    where: { id: applicationId },
    include: { portrait: true },
  });
  if (!application) throw new Error("申请不存在");
  if (application.portrait.ownerId !== ownerId) throw new Error("您不是该肖像的所有者");
  if (application.status !== EntAuthStatus.PENDING_PORTRAIT_OWNER) {
    throw new Error("当前状态不允许此操作");
  }

  return prisma.entAuthApplication.update({
    where: { id: applicationId },
    data: {
      status: EntAuthStatus.REJECTED,
    },
  });
}

/**
 * 平台管理员审核批准
 */
export async function approveByPlatform(
  applicationId: string,
  reviewerId: string,
  actualFee: number
) {
  const application = await prisma.entAuthApplication.findUnique({
    where: { id: applicationId },
    include: {
      portrait: { include: { owner: true } },
    },
  });
  if (!application) throw new Error("申请不存在");
  if (application.status !== EntAuthStatus.PENDING_PLATFORM_REVIEW) {
    throw new Error("当前状态不允许此操作");
  }

  // 创建正式的 Authorization 记录
  const endDate = addDays(new Date(), application.usageDuration);
  const authorization = await prisma.authorization.create({
    data: {
      portraitId: application.portraitId,
      granterId: application.portrait.ownerId,
      granteeId: (await prisma.enterprise.findUnique({ where: { id: application.enterpriseId } }))!.userId,
      licenseType: application.exclusivity ? LicenseType.EXCLUSIVE : LicenseType.NON_EXCLUSIVE,
      usageScope: application.usageScope,
      exclusivity: application.exclusivity,
      territorialScope: application.territorialScope,
      startDate: new Date(),
      endDate,
      licenseFee: actualFee,
      currency: application.currency,
      status: "ACTIVE",
      terms: application.purpose,
    },
  });

  // 生成合同
  const contractHash = await generateAuthorizationContract(authorization.id);

  // 更新申请状态
  const certNo = generateCertNo();
  const updated = await prisma.entAuthApplication.update({
    where: { id: applicationId },
    data: {
      status: EntAuthStatus.APPROVED,
      authorizationId: authorization.id,
      platformReviewerId: reviewerId,
      platformReviewedAt: new Date(),
      proposedFee: actualFee,
      contractHash,
      certificateNo: certNo,
    },
  });

  // 生成授权证书
  await generateCertificatePDF(applicationId, authorization.id, certNo, endDate);

  return updated;
}

/**
 * 平台管理员拒绝
 */
export async function rejectByPlatform(
  applicationId: string,
  reviewerId: string,
  reason: string
) {
  const application = await prisma.entAuthApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new Error("申请不存在");
  if (application.status !== EntAuthStatus.PENDING_PLATFORM_REVIEW) {
    throw new Error("当前状态不允许此操作");
  }

  return prisma.entAuthApplication.update({
    where: { id: applicationId },
    data: {
      status: EntAuthStatus.REJECTED,
      platformReviewerId: reviewerId,
      platformReviewedAt: new Date(),
      platformRejectionReason: reason,
    },
  });
}

/**
 * 获取申请详情
 */
export async function getApplicationDetail(applicationId: string) {
  return prisma.entAuthApplication.findUnique({
    where: { id: applicationId },
    include: {
      portrait: {
        include: { owner: { select: { id: true, displayName: true, email: true } } },
      },
    },
  });
}

/**
 * 获取企业的所有申请
 */
export async function listEnterpriseApplications(enterpriseId: string, status?: EntAuthStatus) {
  return prisma.entAuthApplication.findMany({
    where: { enterpriseId, ...(status ? { status } : {}) },
    include: {
      portrait: {
        select: {
          id: true, title: true, thumbnailUrl: true,
          owner: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 获取肖像所有者收到的所有申请
 */
export async function listOwnerApplications(ownerId: string, status?: EntAuthStatus) {
  const portraits = await prisma.portrait.findMany({
    where: { ownerId },
    select: { id: true },
  });
  const portraitIds = portraits.map(p => p.id);

  return prisma.entAuthApplication.findMany({
    where: {
      portraitId: { in: portraitIds },
      ...(status ? { status } : {}),
    },
    include: {
      portrait: {
        select: {
          id: true, title: true, thumbnailUrl: true,
        },
      },
      // enterprise info via proxy
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 获取所有待平台审核的申请
 */
export async function listPendingPlatformReview(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [applications, total] = await Promise.all([
    prisma.entAuthApplication.findMany({
      where: { status: EntAuthStatus.PENDING_PLATFORM_REVIEW },
      include: {
        portrait: {
          include: { owner: { select: { displayName: true, email: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.entAuthApplication.count({
      where: { status: EntAuthStatus.PENDING_PLATFORM_REVIEW },
    }),
  ]);
  return { applications, total, page, limit };
}

/**
 * 获取活跃的企业授权列表
 */
export async function listActiveAuthorizations(enterpriseId: string) {
  const applications = await prisma.entAuthApplication.findMany({
    where: {
      enterpriseId,
      status: EntAuthStatus.APPROVED,
    },
    include: {
      portrait: {
        select: {
          id: true, title: true, thumbnailUrl: true,
          owner: { select: { displayName: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return applications;
}

/**
 * 撤销授权
 */
export async function revokeAuthorization(applicationId: string, revokerId: string) {
  const application = await prisma.entAuthApplication.findUnique({
    where: { id: applicationId },
    include: { authorization: true },
  });
  if (!application) throw new Error("申请不存在");
  if (application.status !== EntAuthStatus.APPROVED) {
    throw new Error("当前状态不允许撤销");
  }

  await prisma.entAuthApplication.update({
    where: { id: applicationId },
    data: { status: EntAuthStatus.REVOKED },
  });

  if (application.authorizationId) {
    await prisma.authorization.update({
      where: { id: application.authorizationId },
      data: { status: "REVOKED" as any },
    });
  }

  return application;
}
