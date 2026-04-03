/**
 * Enterprise Service
 * 企业认证与资质管理
 */
import { prisma } from "@/lib/prisma";
import { ENTERPRISE_STATUSES } from "@/types/enums";
import { addYears } from "date-fns";

export interface EnterpriseProfile {
  id: string;
  companyName: string;
  unifiedCreditCode: string;
  legalPersonName: string;
  registeredCapital?: string;
  establishedDate?: Date;
  businessTerm?: string;
  businessScope?: string;
  licenseImageUrl: string;
  legalPersonIdCardFrontUrl?: string;
  legalPersonIdCardBackUrl?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  status: EnterpriseStatus;
  isAgency: boolean;
  agencyLicenseUrl?: string;
  validUntil?: Date;
  createdAt: Date;
  userId: string;
}

export interface RegisterEnterpriseInput {
  companyName: string;
  unifiedCreditCode: string;
  legalPersonName: string;
  legalPersonIdCard: string;
  registeredCapital?: string;
  establishedDate?: string;
  businessTerm?: string;
  businessScope?: string;
  licenseImageUrl: string;
  legalPersonIdCardFrontUrl?: string;
  legalPersonIdCardBackUrl?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  isAgency?: boolean;
  agencyLicenseUrl?: string;
}

export async function registerEnterprise(
  userId: string,
  input: RegisterEnterpriseInput
): Promise<EnterpriseProfile> {
  // 检查是否已有企业记录
  const existing = await prisma.enterprise.findUnique({
    where: { userId },
  });
  if (existing) {
    throw new Error("企业认证记录已存在，请更新而非注册");
  }

  // 检查统一社会信用代码是否已被使用
  const codeUsed = await prisma.enterprise.findUnique({
    where: { unifiedCreditCode: input.unifiedCreditCode },
  });
  if (codeUsed) {
    throw new Error("该统一社会信用代码已被其他企业使用");
  }

  const enterprise = await prisma.enterprise.create({
    data: {
      userId,
      companyName: input.companyName,
      unifiedCreditCode: input.unifiedCreditCode,
      legalPersonName: input.legalPersonName,
      legalPersonIdCard: input.legalPersonIdCard,
      registeredCapital: input.registeredCapital,
      establishedDate: input.establishedDate ? new Date(input.establishedDate) : undefined,
      businessTerm: input.businessTerm,
      businessScope: input.businessScope,
      licenseImageUrl: input.licenseImageUrl,
      legalPersonIdCardFrontUrl: input.legalPersonIdCardFrontUrl,
      legalPersonIdCardBackUrl: input.legalPersonIdCardBackUrl,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      isAgency: input.isAgency ?? false,
      agencyLicenseUrl: input.agencyLicenseUrl,
      status: ENTERPRISE_STATUSES.PENDING,
    },
  });

  return enterprise as EnterpriseProfile;
}

export async function updateEnterprise(
  userId: string,
  input: Partial<RegisterEnterpriseInput>
): Promise<EnterpriseProfile> {
  const enterprise = await prisma.enterprise.findUnique({
    where: { userId },
  });
  if (!enterprise) {
    throw new Error("企业认证记录不存在");
  }
  if (enterprise.status === ENTERPRISE_STATUSES.APPROVED) {
    // 已认证的企业信息修改需要重新审核
    const updated = await prisma.enterprise.update({
      where: { id: enterprise.id },
      data: {
        companyName: input.companyName ?? enterprise.companyName,
        contactName: input.contactName ?? enterprise.contactName,
        contactPhone: input.contactPhone ?? enterprise.contactPhone,
        contactEmail: input.contactEmail ?? enterprise.contactEmail,
        // 修改营业执照信息需要重新审核
        licenseImageUrl: input.licenseImageUrl ?? enterprise.licenseImageUrl,
        status: input.licenseImageUrl ? ENTERPRISE_STATUSES.PENDING : enterprise.status,
      },
    });
    return updated as EnterpriseProfile;
  }

  const updated = await prisma.enterprise.update({
    where: { userId },
    data: {
      ...(input.companyName && { companyName: input.companyName }),
      ...(input.legalPersonName && { legalPersonName: input.legalPersonName }),
      ...(input.legalPersonIdCard && { legalPersonIdCard: input.legalPersonIdCard }),
      ...(input.registeredCapital && { registeredCapital: input.registeredCapital }),
      ...(input.establishedDate && { establishedDate: new Date(input.establishedDate) }),
      ...(input.businessTerm && { businessTerm: input.businessTerm }),
      ...(input.businessScope && { businessScope: input.businessScope }),
      ...(input.licenseImageUrl && { licenseImageUrl: input.licenseImageUrl }),
      ...(input.legalPersonIdCardFrontUrl && { legalPersonIdCardFrontUrl: input.legalPersonIdCardFrontUrl }),
      ...(input.legalPersonIdCardBackUrl && { legalPersonIdCardBackUrl: input.legalPersonIdCardBackUrl }),
      ...(input.contactName && { contactName: input.contactName }),
      ...(input.contactPhone && { contactPhone: input.contactPhone }),
      ...(input.contactEmail && { contactEmail: input.contactEmail }),
      ...(input.isAgency !== undefined && { isAgency: input.isAgency }),
      ...(input.agencyLicenseUrl && { agencyLicenseUrl: input.agencyLicenseUrl }),
    },
  });
  return updated as EnterpriseProfile;
}

export async function getEnterpriseProfile(userId: string): Promise<EnterpriseProfile | null> {
  const enterprise = await prisma.enterprise.findUnique({
    where: { userId },
  });
  return enterprise as EnterpriseProfile | null;
}

export async function getEnterpriseById(id: string) {
  return prisma.enterprise.findUnique({
    where: { id },
    include: { 
      // user relation not defined but we can query via userId
    },
  });
}

export async function listPendingEnterprises(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [enterprises, total] = await Promise.all([
    prisma.enterprise.findMany({
      where: { status: ENTERPRISE_STATUSES.PENDING },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.enterprise.count({ where: { status: ENTERPRISE_STATUSES.PENDING } }),
  ]);
  return { enterprises, total, page, limit };
}

export async function reviewEnterprise(
  enterpriseId: string,
  reviewerId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string
) {
  const enterprise = await prisma.enterprise.findUnique({
    where: { id: enterpriseId },
  });
  if (!enterprise) throw new Error("企业记录不存在");
  if (enterprise.status !== ENTERPRISE_STATUSES.PENDING) {
    throw new Error("该企业不在待审核状态");
  }

  const newStatus = action === "APPROVE" ? ENTERPRISE_STATUSES.APPROVED : ENTERPRISE_STATUSES.REJECTED;
  const validUntil = action === "APPROVE" ? addYears(new Date(), 1) : null;

  const updated = await prisma.enterprise.update({
    where: { id: enterpriseId },
    data: {
      status: newStatus,
      reviewerId,
      reviewedAt: new Date(),
      rejectionReason: action === "REJECT" ? rejectionReason : null,
      validUntil,
    },
  });

  // 如果是经纪公司，同步更新用户的 role
  if (action === "APPROVE" && updated.isAgency) {
    await prisma.user.update({
      where: { id: enterprise.userId },
      data: { role: "AGENCY" as any },
    });
  } else if (action === "APPROVE") {
    await prisma.user.update({
      where: { id: enterprise.userId },
      data: { role: "ENTERPRISE" as any },
    });
  }

  return updated;
}
