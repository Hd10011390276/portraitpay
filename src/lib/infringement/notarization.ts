/**
 * Notarization Service — 证据公证集成
 *
 * Provides a unified interface for submitting evidence packages to
 * authorized notarization authorities (公证处).
 *
 * Uses Pinata for IPFS deposition of evidence hashes, enabling
 * third-party verification of evidence integrity over time.
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

// ─────────────────────────────────────────────────────────────────────────────
// Pinata IPFS Integration
// ─────────────────────────────────────────────────────────────────────────────

const PINATA_API_URL = "https://api.pinata.cloud";

/**
 * Upload a JSON evidence package to IPFS via Pinata.
 * Returns the IPFS CID (Content Identifier).
 */
export async function pinataUploadJson(
  data: Record<string, unknown>
): Promise<{ cid: string; size: number }> {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Pinata API credentials not configured");
  }

  const body = {
    pinataContent: data,
    pinataMetadata: {
      name: `PortraitPay-Evidence-${Date.now()}`,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  const res = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} — ${err}`);
  }

  const json = await res.json();
  return { cid: json.IpfsHash, size: json.PinSize };
}

/**
 * Pin an existing IPFS CID (e.g., from a third-party upload).
 */
export async function pinataPinByCid(cid: string, name?: string): Promise<void> {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Pinata API credentials not configured");
  }

  const res = await fetch(`${PINATA_API_URL}/pinning/pinByCID`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: JSON.stringify({
      hashToPin: cid,
      pinataMetadata: { name: name || `PortraitPay-Pin-${cid}` },
      pinataOptions: { cidVersion: 1 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata pin failed: ${res.status} — ${err}`);
  }
}

/**
 * Check whether Pinata credentials are configured.
 */
export function isPinataConfigured(): boolean {
  return !!(
    process.env.PINATA_API_KEY &&
    process.env.PINATA_SECRET_KEY
  );
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
  throw new Error(
    "Notarization service not configured. Set NOTARIZATION_API_KEY and NOTARIZATION_ENDPOINT environment variables to enable third-party notarization."
  );
}

/**
 * Query the status of a notarization request.
 *
 * STUB — replace with actual polling/callback implementation.
 */
export async function getNotarizationStatus(
  notarizationId: string
): Promise<NotarizationStatus> {
  throw new Error("Notarization service not configured.");
}

/**
 * Download the official notarization certificate PDF.
 *
 * STUB — in production this would return a signed S3 URL.
 */
export async function getNotarizationCertificate(
  notarizationId: string
): Promise<string | null> {
  throw new Error("Notarization service not configured.");
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

// ─────────────────────────────────────────────────────────────────────────────
// High-level evidence notarization workflow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full evidence notarization pipeline:
 * 1. Build the evidence manifest JSON
 * 2. Upload to IPFS via Pinata
 * 3. Returns { reportHash, reportIpfsCid }
 */
export async function notarizeInfringementEvidence(params: {
  reportId: string;
  portraitId: string;
  reporterId: string;
  type: string;
  description: string;
  evidenceUrls: string[];
  detectedUrl?: string;
  capturedAt?: Date;
}): Promise<{ reportHash: string; reportIpfsCid: string }> {
  const { createHash } = await import("crypto");

  const { reportId, portraitId, reporterId, type, description, evidenceUrls, detectedUrl, capturedAt } = params;

  // Build deterministic evidence manifest
  const manifest = {
    reportId,
    portraitId,
    reporterId,
    type,
    description,
    evidenceUrls,
    detectedUrl: detectedUrl || null,
    capturedAt: (capturedAt || new Date()).toISOString(),
    platform: "PortraitPay AI",
    version: "1.0",
  };

  // Compute reportHash from manifest (deterministic — matches what we store in DB)
  const reportHash = createHash("sha256")
    .update(JSON.stringify({ portraitId, type, description, detectedUrl, evidenceUrls }))
    .digest("hex");

  // Upload manifest to IPFS
  const { cid } = await pinataUploadJson(manifest);

  return { reportHash, reportIpfsCid: cid };
}
