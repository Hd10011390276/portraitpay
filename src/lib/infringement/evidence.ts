/**
 * Evidence Preservation Service
 *
 * Responsibilities:
 * 1. Capture a screenshot / full HTML of the infringing page
 * 2. Compute SHA-256 hash of evidence for tamper detection
 * 3. Store evidence in S3/R2 with structured metadata
 * 4. Record EvidencePackage in the database
 * 5. (Optional) Upload to IPFS for decentralized backup
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { uploadToIpfs } from "@/lib/ipfs";
import { captureUrlScreenshot, bufferHash } from "./screenshot";

export interface EvidenceCapture {
  evidenceUrl: string;      // where the evidence is stored (S3/R2 URL)
  contentHash: string;      // SHA-256 of the raw evidence content
  capturedAt: Date;
  mimeType: string;
  pageTitle?: string;
  pageDescription?: string;
  pageSnapshotUrl?: string; // R2 URL of the full-page PNG screenshot
  screenshotHash?: string;  // SHA-256 of the screenshot
}

/**
 * Capture and preserve a screenshot of an infringing page.
 *
 * In production this would call a screenshot API (e.g., Browserless, ScreenshotAPI,
 * or a self-hosted Chromium with puppeteer). We provide a stub implementation
 * that demonstrates the full evidence workflow.
 */
export async function captureEvidence(
  targetUrl: string,
  metadata: {
    reportId?: string;
    alertId?: string;
    capturedBy?: string;
  } = {}
): Promise<EvidenceCapture> {
  const capturedAt = new Date();

  // ── Step 1: Fetch page HTML ──────────────────────────────────────────────
  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PortraitPayBot/1.0; +https://portraitpayai.com/bot)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch target page: ${response.status} ${response.statusText}`);
  }

  const htmlBuffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type") ?? "text/html";

  // ── Step 2: Compute content hash (SHA-256) ───────────────────────────────
  const contentHash = crypto.createHash("sha256").update(htmlBuffer).digest("hex");

  // ── Step 3: Extract page metadata ─────────────────────────────────────────
  let pageTitle: string | undefined;
  let pageDescription: string | undefined;

  const htmlString = htmlBuffer.toString("utf-8");
  const titleMatch = htmlString.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) pageTitle = titleMatch[1].trim();

  const descMatch = htmlString.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  );
  if (descMatch) pageDescription = descMatch[1].trim();

  // ── Step 4: Store HTML in S3/R2 (local fallback if not configured) ─────────
  const evidenceKey = `evidence/${metadata.reportId ?? metadata.alertId ?? "unknown"}/${capturedAt.getTime()}-${contentHash.slice(0, 12)}.html`;
  let evidenceUrl: string;
  try {
    evidenceUrl = await storeEvidenceToS3(evidenceKey, htmlBuffer, mimeType);
  } catch {
    const fs = await import("fs/promises");
    const path = await import("path");
    const localDir = path.join(process.cwd(), "public", "evidence");
    await fs.mkdir(localDir, { recursive: true });
    const localPath = path.join(localDir, `${contentHash.slice(0, 12)}.html`);
    await fs.writeFile(localPath, htmlBuffer);
    evidenceUrl = `/evidence/${contentHash.slice(0, 12)}.html`;
  }

  // ── Step 5: Save EvidencePackage record ───────────────────────────────────
  await prisma.evidencePackage.create({
    data: {
      reportId: metadata.reportId,
      alertId: metadata.alertId,
      evidenceType: "html_archive",
      evidenceUrl,
      evidenceKey,
      capturedAt,
      capturedBy: metadata.capturedBy ?? "SYSTEM",
      contentHash,
      pageUrl: targetUrl,
      pageTitle,
    },
  });

  // ── Step 6: Capture full-page screenshot (non-blocking) ──────────────────
  let pageSnapshotUrl: string | undefined;
  let screenshotHash: string | undefined;

  try {
    const { buffer: screenshotBuffer, metadata: pageMeta } =
      await captureUrlScreenshot(targetUrl);
    screenshotHash = bufferHash(screenshotBuffer);
    const screenshotKey = `evidence/${metadata.reportId ?? metadata.alertId ?? "unknown"}/screenshot-${screenshotHash.slice(0, 12)}.png`;

    try {
      pageSnapshotUrl = await storeEvidenceToS3(
        screenshotKey,
        screenshotBuffer,
        "image/png"
      );
    } catch {
      // R2 not configured — save locally as fallback
      const fs = await import("fs/promises");
      const path = await import("path");
      const localDir = path.join(process.cwd(), "public", "evidence");
      await fs.mkdir(localDir, { recursive: true });
      const localPath = path.join(localDir, `screenshot-${screenshotHash.slice(0, 12)}.png`);
      await fs.writeFile(localPath, screenshotBuffer);
      pageSnapshotUrl = `/evidence/screenshot-${screenshotHash.slice(0, 12)}.png`;
    }

    // Update pageTitle if screenshot extracted a better one
    if (pageMeta.title && !pageTitle) pageTitle = pageMeta.title;
    if (pageMeta.description && !pageDescription)
      pageDescription = pageMeta.description;

    await prisma.evidencePackage.create({
      data: {
        reportId: metadata.reportId,
        alertId: metadata.alertId,
        evidenceType: "page_snapshot",
        evidenceUrl: pageSnapshotUrl,
        evidenceKey: screenshotKey,
        capturedAt,
        capturedBy: metadata.capturedBy ?? "SYSTEM",
        contentHash: screenshotHash,
        pageUrl: targetUrl,
        pageTitle: pageTitle ?? pageMeta.title,
        pageSnapshotUrl,
      },
    });
  } catch (err) {
    console.error(
      `[Evidence] Screenshot capture failed for ${targetUrl}:`,
      err instanceof Error ? err.message : String(err)
    );
    // Screenshot is best-effort — don't fail the whole capture
  }

  return {
    evidenceUrl,
    contentHash,
    capturedAt,
    mimeType,
    pageTitle,
    pageDescription,
    pageSnapshotUrl,
    screenshotHash,
  };
}

/**
 * Store raw evidence bytes to S3/R2.
 */
async function storeEvidenceToS3(
  key: string,
  data: Buffer,
  mimeType: string
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.AWS_S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    ...(process.env.AWS_ENDPOINT ? { endpoint: process.env.AWS_ENDPOINT } : {}),
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: data,
      ContentType: mimeType,
      // Add integrity header
      Metadata: {
        "content-sha256": crypto.createHash("sha256").update(data).digest("hex"),
      },
    })
  );

  if (process.env.AWS_ENDPOINT) {
    return `${process.env.AWS_ENDPOINT}/${key}`;
  }
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Compute the SHA-256 hash of a file given its S3 URL.
 * Downloads the file locally (or via signed URL) and hashes it.
 */
export async function hashEvidenceUrl(_evidenceUrl: string): Promise<string> {
  // In production: download via S3 SDK → hash → return
  // Stub: return a placeholder; real implementation would do:
  //
  // const s3 = new S3Client({ ... });
  // const command = new GetObjectCommand({ Bucket, Key });
  // const { Body } = await s3.send(command);
  // const chunks: Buffer[] = [];
  // for await (const chunk of Body) chunks.push(chunk);
  // return crypto.createHash("sha256").update(Buffer.concat(chunks)).digest("hex");
  throw new Error("hashEvidenceUrl not implemented — use S3 SDK in production");
}

/**
 * Upload evidence to IPFS for decentralized backup.
 * Returns the IPFS CID.
 */
export async function notarizeToIpfs(
  evidenceBuffer: Buffer,
  fileName: string
): Promise<string> {
  const result = await uploadToIpfs(evidenceBuffer, fileName, "text/html");
  return result.cid;
}

/**
 * Build a deterministic evidence hash for the report's evidence set.
 * This is stored on-chain to prove the evidence existed at a given time.
 */
export function buildEvidenceSetHash(
  evidenceItems: Array<{ contentHash: string; capturedAt: Date; evidenceUrl: string }>
): string {
  const canonical = evidenceItems
    .sort((a, b) => a.evidenceUrl.localeCompare(b.evidenceUrl))
    .map((e) => `${e.contentHash}:${e.capturedAt.toISOString()}:${e.evidenceUrl}`)
    .join("|");

  return crypto.createHash("sha256").update(canonical).digest("hex");
}

/**
 * Record evidence from text description and optional URL.
 * Cold-start path — no screenshot, no IPFS, no external API calls.
 * Computes SHA-256 of url|description and stores directly as EvidencePackage.
 */
export async function recordManualEvidence(params: {
  evidenceUrl?: string;
  evidenceDescription: string;
  capturedBy: string;
}): Promise<EvidenceCapture> {
  const capturedAt = new Date();
  const contentHash = crypto.createHash("sha256")
    .update((params.evidenceUrl || "") + "|" + params.evidenceDescription)
    .digest("hex");

  await prisma.evidencePackage.create({
    data: {
      evidenceType: "manual_entry",
      evidenceUrl: params.evidenceUrl || "",
      capturedAt,
      capturedBy: params.capturedBy,
      contentHash,
      pageUrl: params.evidenceUrl || null,
      pageTitle: params.evidenceDescription.substring(0, 200),
    },
  });

  return {
    evidenceUrl: params.evidenceUrl || "",
    contentHash,
    capturedAt,
    mimeType: "text/plain",
    pageTitle: params.evidenceDescription.substring(0, 200),
  };
}
