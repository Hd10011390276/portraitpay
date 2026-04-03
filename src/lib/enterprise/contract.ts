/**
 * Authorization Contract Generator
 * 生成电子授权合同，存入 IPFS，返回哈希
 */
import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage";
import { addDays, format } from "date-fns";

export async function generateAuthorizationContract(authorizationId: string): Promise<string> {
  const auth = await prisma.authorization.findUnique({
    where: { id: authorizationId },
    include: {
      portrait: { include: { owner: true } },
      grantee: true,
      granter: true,
    },
  });
  if (!auth) throw new Error("Authorization not found");

  const enterprise = await prisma.enterprise.findUnique({
    where: { userId: auth.granteeId },
  });

  // 构建合同内容
  const contract = {
    contractId: authorizationId,
    title: `肖像授权使用合同`,
    createdAt: new Date().toISOString(),
    parties: {
      grantor: {
        name: auth.granter.displayName ?? auth.granter.email,
        email: auth.granter.email,
        id: auth.granterId,
      },
      grantee: {
        name: enterprise?.companyName ?? auth.grantee.displayName ?? auth.grantee.email,
        contactName: enterprise?.contactName,
        contactEmail: enterprise?.contactEmail,
        unifiedCreditCode: enterprise?.unifiedCreditCode,
        id: auth.granteeId,
      },
    },
    portrait: {
      id: auth.portrait.id,
      title: auth.portrait.title,
      description: auth.portrait.description,
      imageHash: auth.portrait.imageHash,
    },
    license: {
      type: auth.licenseType,
      usageScope: auth.usageScope,
      exclusivity: auth.exclusivity,
      territorialScope: auth.territorialScope,
      startDate: auth.startDate.toISOString(),
      endDate: auth.endDate?.toISOString(),
      fee: auth.licenseFee,
      currency: auth.currency,
    },
    terms: auth.terms,
    platform: {
      name: "PortraitPay AI",
      url: "https://portraitpayai.com",
    },
  };

  const contractJson = JSON.stringify(contract, null, 2);
  const fileName = `contracts/${authorizationId}/contract.json`;

  // 上传到 IPFS/存储
  const ipfsCid = await storageService.uploadJson(contractJson, fileName);

  // 计算哈希
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(contractJson);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // 更新授权记录
  await prisma.authorization.update({
    where: { id: authorizationId },
    data: {
      contractHash: hashHex,
      contractIpfsCid: ipfsCid,
    },
  });

  return hashHex;
}

export async function getContractContent(authorizationId: string) {
  const auth = await prisma.authorization.findUnique({
    where: { id: authorizationId },
    include: {
      portrait: { include: { owner: true } },
      grantee: true,
      granter: true,
    },
  });
  if (!auth) throw new Error("Authorization not found");

  const enterprise = await prisma.enterprise.findUnique({
    where: { userId: auth.granteeId },
  });

  return {
    contractId: auth.id,
    title: "肖像授权使用合同",
    createdAt: auth.createdAt.toISOString(),
    parties: {
      grantor: {
        name: auth.granter.displayName ?? auth.granter.email,
        email: auth.granter.email,
      },
      grantee: {
        name: enterprise?.companyName ?? auth.grantee.displayName ?? auth.grantee.email,
        contactName: enterprise?.contactName,
        contactEmail: enterprise?.contactEmail,
        unifiedCreditCode: enterprise?.unifiedCreditCode,
      },
    },
    portrait: {
      id: auth.portrait.id,
      title: auth.portrait.title,
      description: auth.portrait.description,
    },
    license: {
      type: auth.licenseType,
      usageScope: auth.usageScope,
      exclusivity: auth.exclusivity,
      territorialScope: auth.territorialScope,
      startDate: auth.startDate.toISOString(),
      endDate: auth.endDate?.toISOString(),
      fee: auth.licenseFee,
      currency: auth.currency,
    },
    terms: auth.terms,
    contractHash: auth.contractHash,
    contractIpfsCid: auth.contractIpfsCid,
  };
}
