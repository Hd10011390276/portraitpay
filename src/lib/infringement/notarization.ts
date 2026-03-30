/**
 * Notarization Service — 证据公证集成
 *
 * Provides a unified interface for submitting evidence packages to
 * authorized notarization authorities (公证处).
 *
 * Currently implemented as a STUB — replace with real 公证处 API calls
 * when integrating with a provider such as:
 *   - 北京互联网法院「天平链」电子证据平台
 *   - 蚂蚁链「司法联盟链」
 *   - 杭州互联网法院「之江共识」存证平台
 *   - 各地公证处在线受理 API
 *
 * Key concepts:
 *   - 证据固化 (Evidence Solidification): making evidence tamper-evident
 *   - 公证书 (Notarization Certificate): official document from 公证处
 *   - 在线受理 (Online Filing): file a notarization request via API
 */

export interface NotarizationRequest {
  /** Unique identifier in our system */
  internalId: string;
  /** Type of evidence: "infringement_report" | "screenshot" | "html_archive" */
  evidenceType: string;
  /** SHA-256 hash of the evidence content */
  evidenceHash: string;
  /** IPFS CID where evidence is stored (decentralized backup) */
  ipfsCid?: string;
  /** S3/R2 URL of the evidence file */
  evidenceUrl?: string;
  /** Timestamp when evidence was captured */
  capturedAt: Date;
  /** Description of the evidence for the notary */
  description: string;
  /** Reporter's identity information */
  reporterName?: string;
  reporterIdCard?: string; // encrypted
}

export interface NotarizationResult {
  /** 公证处返回的受理编号 */
  notarizationId: string;
  /** 公证书编号 */
  certificateNo: string;
  /** 区块链哈希（公证处上链） */
  chainHash?: string;
  /** 公证处签发时间 */
  issuedAt: Date;
  /** 公证处名称 */
  authority: string;
  /** 公证处 API 回调 URL（用于查询状态） */
  queryUrl?: string;
  /** 原始响应 */
  raw?: unknown;
}

export interface NotarizationStatus {
  notarizationId: string;
  status: "PENDING" | "PROCESSING" | "ISSUED" | "REJECTED" | "EXPIRED";
  certificateNo?: string;
  chainHash?: string;
  issuedAt?: Date;
  rejectionReason?: string;
}

/**
 * Submit an evidence package to the notary authority.
 *
 * STUB — replace with actual API call.
 *
 * Example real API (北京互联网法院天平链):
 *   POST https://cpqc.jufaanthing.com/api/evidence/upload
 *   Headers: Authorization: Bearer <token>
 *   Body: { hash, timestamp, evidenceType, ... }
 */
export async function submitForNotarization(
  request: NotarizationRequest
): Promise<NotarizationResult> {
  console.warn(
    `[Notarization] STUB CALLED — not submitting to real 公证处. Request:`,
    JSON.stringify(request, null, 2)
  );

  // Simulate API response
  const stubResult: NotarizationResult = {
    notarizationId: `NOT-${Date.now()}`,
    certificateNo: `GZS-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    chainHash: `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`,
    issuedAt: new Date(),
    authority: "STUB_NOTARIZATION_AUTHORITY",
    queryUrl: "https://notarization.example.com/query/STUB",
  };

  return stubResult;
}

/**
 * Query the status of a notarization request.
 *
 * STUB — replace with actual polling/callback implementation.
 */
export async function getNotarizationStatus(
  notarizationId: string
): Promise<NotarizationStatus> {
  console.warn(`[Notarization] STUB — querying status for ${notarizationId}`);

  return {
    notarizationId,
    status: "ISSUED",
    certificateNo: `GZS-${new Date().getFullYear()}-STUB`,
    chainHash: `0x${"a".repeat(64)}`,
    issuedAt: new Date(),
  };
}

/**
 * Download the official notarization certificate PDF.
 *
 * STUB — in production this would return a signed S3 URL.
 */
export async function getNotarizationCertificate(
  notarizationId: string
): Promise<string | null> {
  console.warn(`[Notarization] STUB — certificate download for ${notarizationId}`);
  // Real implementation:
  //   const status = await getNotarizationStatus(notarizationId);
  //   if (status.status !== "ISSUED") return null;
  //   const response = await fetch(`${NOTARIZATION_API}/cert/${notarizationId}/pdf`);
  //   return response.url; // signed URL
  return null;
}

/**
 * Check if the notarization service is available.
 * Returns true if API credentials are configured.
 */
export function isNotarizationConfigured(): boolean {
  return !!(
    process.env.NOTARIZATION_API_KEY ||
    process.env.NOTARIZATION_ENDPOINT
  );
}
