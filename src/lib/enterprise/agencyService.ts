/**
 * Agency Service
 * 经纪公司代理授权管理
 */
import { prisma } from "@/lib/prisma";
import type { EntAuthStatus, LicenseType } from "@/types/enums";
import { ENT_AUTH_STATUSES } from "@/types/enums";
import { addDays } from "date-fns";

export interface AddArtistInput {
  agencyId: string;
  artistId: string;
  proxyAgreementUrl?: string;
  proxyStartDate?: string;
  proxyEndDate?: string;
}

export interface BatchAuthorizationInput {
  agencyId: string;
  portraitIds: string[]; // 艺人肖像 IDs
  enterpriseId: string;  // 申请授权的企业
  purpose: string;
  usageScope: string[];
  exclusivity?: boolean;
  territorialScope?: string;
  usageDuration: number;
  proposedFee: number;
  currency?: string;
}

/**
 * 经纪公司添加代理艺人
 */
export async function addArtistToAgency(input: AddArtistInput) {
  const agency = await prisma.enterprise.findUnique({
    where: { id: input.agencyId },
  });
  if (!agency) throw new Error("经纪公司不存在");
  if (!agency.isAgency) throw new Error("该公司不是经纪公司");
  if (agency.status !== "APPROVED") throw new Error("经纪公司尚未通过认证");

  const artist = await prisma.user.findUnique({
    where: { id: input.artistId },
  });
  if (!artist) throw new Error("艺人用户不存在");

  // 检查是否已在代理列表中
  const existing = await prisma.agencyArtist.findUnique({
    where: { agencyId_artistId: { agencyId: input.agencyId, artistId: input.artistId } },
  });
  if (existing) throw new Error("该艺人已在代理列表中");

  const relation = await prisma.agencyArtist.create({
    data: {
      agencyId: input.agencyId,
      artistId: input.artistId,
      proxyAgreementUrl: input.proxyAgreementUrl,
      proxyStartDate: input.proxyStartDate ? new Date(input.proxyStartDate) : undefined,
      proxyEndDate: input.proxyEndDate ? new Date(input.proxyEndDate) : undefined,
      proxyStatus: "ACTIVE",
    },
  });

  return relation;
}

/**
 * 获取经纪公司代理的所有艺人
 */
export async function listAgencyArtists(agencyId: string) {
  const artists = await prisma.agencyArtist.findMany({
    where: { agencyId, proxyStatus: "ACTIVE" },
  });

  const artistIds = artists.map(a => a.artistId);
  const users = await prisma.user.findMany({
    where: { id: { in: artistIds } },
    select: { id: true, displayName: true, email: true, kycStatus: true },
  });

  const portraits = await prisma.portrait.findMany({
    where: { ownerId: { in: artistIds }, status: "ACTIVE" },
    select: { id: true, title: true, ownerId: true, thumbnailUrl: true },
  });

  return artists.map(relation => {
    const user = users.find(u => u.id === relation.artistId)!;
    const userPortraits = portraits.filter(p => p.ownerId === relation.artistId);
    return {
      ...relation,
      artist: user,
      portraits: userPortraits,
    };
  });
}

/**
 * 移除代理艺人
 */
export async function removeArtistFromAgency(agencyArtistId: string) {
  return prisma.agencyArtist.update({
    where: { id: agencyArtistId },
    data: { proxyStatus: "REVOKED" },
  });
}

/**
 * 经纪公司批量发起授权申请
 */
export async function batchCreateAuthorization(input: BatchAuthorizationInput) {
  const agency = await prisma.enterprise.findUnique({
    where: { id: input.agencyId },
  });
  if (!agency?.isAgency || agency.status !== "APPROVED") {
    throw new Error("经纪公司未通过认证");
  }

  const results: Array<{ portraitId: string; applicationId?: string; error?: string }> = [];

  for (const portraitId of input.portraitIds) {
    try {
      // 查找该肖像的 owner 是否在代理列表中
      const portrait = await prisma.portrait.findUnique({
        where: { id: portraitId },
      });
      if (!portrait) {
        results.push({ portraitId, error: "肖像不存在" });
        continue;
      }

      const agencyRelation = await prisma.agencyArtist.findUnique({
        where: { agencyId_artistId: { agencyId: input.agencyId, artistId: portrait.ownerId } },
      });
      if (!agencyRelation || agencyRelation.proxyStatus !== "ACTIVE") {
        results.push({ portraitId, error: "该肖像所有者未授权本经纪公司代理" });
        continue;
      }

      // 检查是否有进行中的申请
      const existing = await prisma.entAuthApplication.findFirst({
        where: {
          enterpriseId: input.enterpriseId,
          portraitId,
          status: { in: ["PENDING_PORTRAIT_OWNER", "PENDING_PLATFORM_REVIEW"] },
        },
      });
      if (existing) {
        results.push({ portraitId, error: "已有进行中的授权申请" });
        continue;
      }

      const application = await prisma.entAuthApplication.create({
        data: {
          enterpriseId: input.enterpriseId,
          portraitId,
          purpose: input.purpose,
          usageScope: input.usageScope,
          exclusivity: input.exclusivity ?? false,
          territorialScope: input.territorialScope ?? "global",
          usageDuration: input.usageDuration,
          proposedFee: input.proposedFee,
          currency: input.currency ?? "CNY",
          status: ENT_AUTH_STATUSES.PENDING_PORTRAIT_OWNER,
        },
      });

      results.push({ portraitId, applicationId: application.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      results.push({ portraitId, error: msg });
    }
  }

  return results;
}

/**
 * 经纪公司批量确认授权（批量接受申请）
 */
export async function batchConfirmByAgency(
  agencyId: string,
  applicationIds: string[]
) {
  const results: Array<{ applicationId: string; success: boolean; error?: string }> = [];

  for (const appId of applicationIds) {
    try {
      const application = await prisma.entAuthApplication.findUnique({
        where: { id: appId },
      });
      if (!application) throw new Error("申请不存在");

      // Fetch the portrait to get ownerId
      const portrait = await prisma.portrait.findUnique({
        where: { id: application.portraitId },
        select: { ownerId: true },
      });

      // 检查该肖像 owner 是否在 agency 的代理列表中
      const relation = await prisma.agencyArtist.findUnique({
        where: {
          agencyId_artistId: { agencyId, artistId: portrait?.ownerId ?? application.portraitId },
        },
      });
      if (!relation || relation.proxyStatus !== "ACTIVE") {
        throw new Error("无权代理该肖像");
      }

      if (application.status !== ENT_AUTH_STATUSES.PENDING_PORTRAIT_OWNER) {
        throw new Error("状态不允许此操作");
      }

      const updated = await prisma.entAuthApplication.update({
        where: { id: appId },
        data: {
          status: ENT_AUTH_STATUSES.PENDING_PLATFORM_REVIEW,
          portraitOwnerConfirmed: true,
          portraitOwnerConfirmedAt: new Date(),
        },
      });
      results.push({ applicationId: appId, success: true });
    } catch (err) {
      results.push({
        applicationId: appId,
        success: false,
        error: err instanceof Error ? err.message : "未知错误",
      });
    }
  }

  return results;
}

/**
 * 获取经纪公司的所有授权申请
 */
export async function listAgencyApplications(agencyId: string, status?: EntAuthStatus) {
  const artists = await prisma.agencyArtist.findMany({
    where: { agencyId, proxyStatus: "ACTIVE" },
    select: { artistId: true },
  });
  const artistIds = artists.map(a => a.artistId);

  const portraits = await prisma.portrait.findMany({
    where: { ownerId: { in: artistIds } },
    select: { id: true, ownerId: true },
  });
  const portraitIds = portraits.map(p => p.id);

  const applications = await prisma.entAuthApplication.findMany({
    where: {
      portraitId: { in: portraitIds },
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const portraitIdSet = Array.from(new Set(applications.map(a => a.portraitId)));
  const portraitDetails = await prisma.portrait.findMany({
    where: { id: { in: portraitIdSet } },
    select: { id: true, title: true, thumbnailUrl: true },
  });
  const portraitMap = Object.fromEntries(portraitDetails.map(p => [p.id, p]));

  return applications.map(app => ({
    ...app,
    portrait: portraitMap[app.portraitId],
  }));
}
