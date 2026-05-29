/**
 * Infringement Monitoring Scanner Service
 *
 * Implements the 7×24h monitoring logic:
 * 1. Loads all active portraits with their face embeddings
 * 2. For each monitoring target (platform, keyword), crawl public pages
 * 3. Extract face embeddings from crawled images
 * 4. Run face similarity search against registered portraits
 * 5. Create InfringementAlert for matches above threshold
 * 6. Notify portrait owners
 *
 * The actual web crawling / scraping is stubbed out — replace with
 * integrations like:
 *   - Brandwatch / Talkwalker (social media monitoring)
 *   - Google Alerts API
 *   - Platform-specific APIs (Weibo, Douyin open platform)
 *   - Screenshot + face detection pipelines
 *
 * This file is the orchestration layer; individual platform crawlers
 * are registered as "sources".
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_API_KEY?: string;
      GOOGLE_CSE_ID?: string;
    }
  }
}

import { prisma } from "@/lib/prisma";
import { findSimilarPortraits, extractEmbeddingFromUrl, SimilarityMatch } from "./face-similarity";
import { captureEvidence } from "./evidence";
import { sendInfringementAlertEmail } from "./notifications";

export interface MonitorConfig {
  enabledPlatforms: string[];
  excludedPlatforms: string[];
  similarityThreshold: number;
  ownerId?: string;
}

export interface ScanTarget {
  platform: string;
  sourceType: "social_media" | "ai_platform" | "ecommerce" | "website";
  // Resolvable URL or search query
  url: string;
  keywords?: string[]; // For search-based crawling
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform crawlers (stubs — register real implementations here)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List of registered scanning sources.
 * Each source returns a list of image URLs found on that platform/page.
 *
 * Real integrations to add:
 *   - Weibo image search API
 *   - Douyin/TikTok content API
 *   - Xiaohongshu (RED) note search
 *   - Google Images (reverse image search API)
 *   - Stock image sites (Unsplash, Getty, etc.)
 */
const SCAN_SOURCES: Array<{
  name: string;
  type: "social_media" | "ai_platform" | "ecommerce" | "website";
  /**
   * Fetch page and return all image URLs found.
   * Return [] if the source is down or rate-limited.
   */
  fetchImageUrls: (keywords: string[]) => Promise<string[]>;
}> = [
  {
    name: "GoogleImages",
    type: "ai_platform",
    fetchImageUrls: async (keywords: string[]) => {
      const apiKey = process.env.GOOGLE_API_KEY;
      const cseId = process.env.GOOGLE_CSE_ID;
      if (!apiKey || !cseId) {
        console.warn("[Scanner] Google CSE not configured, skipping");
        return [];
      }
      try {
        const allUrls: string[] = [];
        for (const query of keywords.slice(0, 3)) {
          const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cseId)}&q=${encodeURIComponent(query)}&searchType=image&num=10`;
          const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
          if (!res.ok) continue;
          const data = await res.json();
          for (const item of (data.items ?? [])) {
            if (item.link) allUrls.push(item.link);
            if (item.image?.thumbnailLink) allUrls.push(item.image.thumbnailLink);
          }
        }
        return [...new Set(allUrls)];
      } catch (err) {
        console.warn("[Scanner] Google CSE request failed:", err);
        return [];
      }
    },
  },
  {
    name: "Weibo",
    type: "social_media",
    async fetchImageUrls() {
      // STUB — Weibo Open Platform API (需要企业认证)
      return [];
    },
  },
  {
    name: "Xiaohongshu",
    type: "social_media",
    async fetchImageUrls() {
      // STUB — 小红书没有公开 API，建议使用第三方监测服务（Brandwatch / CWatch）
      return [];
    },
  },
  {
    name: "Tiktok",
    type: "social_media",
    async fetchImageUrls() {
      // STUB — TikTok Content API (需要商业合作)
      return [];
    },
  },
  {
    name: "BaiduImages",
    type: "website",
    async fetchImageUrls() {
      // STUB — 百度图片搜索
      return [];
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Core scanning logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run one full monitoring scan cycle.
 *
 * Called by the cron job every hour. Processes portraits in batches
 * to avoid OOM on large portrait libraries.
 *
 * @param config - Monitoring configuration overrides
 */
export async function runMonitoringCycle(config?: Partial<MonitorConfig>): Promise<{
  alertsCreated: number;
  portraitsScanned: number;
  urlsScanned: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let alertsCreated = 0;
  let portraitsScanned = 0;
  let urlsScanned = 0;

  console.log("[Monitor] Starting monitoring cycle...");

  // ── Step 1: Load monitoring config for all active users ───────────────────
  const userConfigs = await prisma.infringementMonitorConfig.findMany({
    where: { enabled: true },
    include: { user: { select: { id: true, email: true, displayName: true } } },
  });

  if (!userConfigs.length) {
    console.log("[Monitor] No users have monitoring enabled. Skipping cycle.");
    return { alertsCreated: 0, portraitsScanned: 0, urlsScanned: 0, errors: [] };
  }

  // ── Step 2: For each user config, scan their portraits ───────────────────
  for (const userConfig of userConfigs) {
    const threshold = config?.similarityThreshold ?? userConfig.similarityThreshold;
    const ownerId = userConfig.userId;

    try {
      // Load all ACTIVE portraits for this owner
      const portraits = await prisma.portrait.findMany({
        where: { ownerId, status: "ACTIVE", deletedAt: null },
        select: { id: true, title: true, ownerId: true },
      });

      if (!portraits.length) continue;

      portraitsScanned += portraits.length;

      // ── Step 3: Collect candidate image URLs from all scan sources ──────
      const searchKeywords = portraits.flatMap(p => [p.title, ...(p.tags ?? [])].filter(Boolean));
      const candidateUrls = await collectCandidateUrls(
        userConfig.enabledPlatforms,
        userConfig.excludedPlatforms,
        searchKeywords
      );

      if (!candidateUrls.length) {
        console.log(`[Monitor] No candidate URLs from sources for user ${ownerId}`);
        continue;
      }

      urlsScanned += candidateUrls.length;

      // ── Step 4: For each URL, run face similarity check ──────────────────
      const batchSize = 10; // Process in batches to avoid rate limits
      for (let i = 0; i < candidateUrls.length; i += batchSize) {
        const batch = candidateUrls.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (url) => {
            const alert = await processUrlForInfringement(url, portraits, threshold);
            if (alert) alertsCreated++;
          })
        );

        // Rate limit: sleep 500ms between batches
        await sleep(500);
      }
    } catch (err) {
      const msg = `User ${ownerId} scan error: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[Monitor] ${msg}`);
      errors.push(msg);
    }
  }

  console.log(`[Monitor] Cycle complete. Alerts: ${alertsCreated}, Portraits: ${portraitsScanned}, URLs: ${urlsScanned}`);
  return { alertsCreated, portraitsScanned, urlsScanned, errors };
}

/**
 * Process a single URL for potential infringement.
 * Returns the created alert if similarity match found, null otherwise.
 */
async function processUrlForInfringement(
  url: string,
  portraits: Array<{ id: string; title: string; ownerId: string }>,
  threshold: number
): Promise<string | null> {
  // Extract face embedding from the crawled image
  const embedding = await extractEmbeddingFromUrl(url);
  if (!embedding) return null;

  // Find matches above threshold
  const matches = await findSimilarPortraits(embedding, {
    minScore: threshold,
    excludePortraitIds: [],
  });

  if (!matches.length) return null;

  // Use the highest-scoring match
  const bestMatch = matches[0];
  const portrait = portraits.find((p) => p.id === bestMatch.portraitId);
  if (!portrait) return null;

  // Identify which source platform this URL belongs to
  const sourcePlatform = detectPlatform(url);

  // ── Capture evidence ──────────────────────────────────────────────────────
  let screenshotUrl: string | undefined;
  let screenshotHash: string | undefined;

  try {
    const evidence = await captureEvidence(url);
    screenshotUrl = evidence.evidenceUrl;
    screenshotHash = evidence.contentHash;
  } catch (err) {
    console.warn(`[Monitor] Failed to capture evidence for ${url}:`, err);
  }

  // ── Create alert ──────────────────────────────────────────────────────────
  const alert = await prisma.infringementAlert.create({
    data: {
      portraitId: portrait.id,
      sourceUrl: url,
      sourceName: sourcePlatform.name,
      sourceType: sourcePlatform.type,
      similarityScore: bestMatch.similarityScore,
      matchedEmbedding: bestMatch.embeddingSnapshot,
      screenshotUrl,
      screenshotHash,
      status: "PENDING",
      ownerId: portrait.ownerId,
    },
  });

  console.log(
    `[Monitor] Alert created: ${alert.id} — ${portrait.title} @ ${url} (similarity: ${(bestMatch.similarityScore * 100).toFixed(1)}%)`
  );

  // ── Send owner notification ───────────────────────────────────────────────
  const ownerConfig = await prisma.infringementMonitorConfig.findUnique({
    where: { userId: portrait.ownerId },
    include: { user: true },
  });

  if (ownerConfig) {
    await sendInfringementAlertEmail({
      ownerEmail: ownerConfig.user.email,
      ownerName: ownerConfig.user.displayName ?? "用户",
      portraitTitle: portrait.title,
      alertId: alert.id,
      similarityScore: bestMatch.similarityScore,
      infringingUrl: url,
      platform: sourcePlatform.name,
      screenshotUrl,
    });
  }

  return alert.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collect candidate image URLs from all (or filtered) scan sources.
 */
async function collectCandidateUrls(
  enabledPlatforms: string[],
  excludedPlatforms: string[],
  keywords: string[]
): Promise<string[]> {
  const sources = SCAN_SOURCES.filter((s) => {
    if (excludedPlatforms.includes(s.name)) return false;
    if (enabledPlatforms.length && !enabledPlatforms.includes(s.name)) return false;
    return true;
  });

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      try {
        return await source.fetchImageUrls(keywords);
      } catch {
        return [];
      }
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<string[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
}

/**
 * Detect which platform a URL belongs to (basic heuristic).
 */
function detectPlatform(url: string): { name: string; type: "social_media" | "ai_platform" | "ecommerce" | "website" } {
  const u = url.toLowerCase();
  if (u.includes("weibo") || u.includes("weibo.com")) return { name: "Weibo", type: "social_media" };
  if (u.includes("xiaohongshu") || u.includes("xhslink") || u.includes("red")) return { name: "Xiaohongshu", type: "social_media" };
  if (u.includes("douyin") || u.includes("tiktok") || u.includes("bytedance")) return { name: "Tiktok/Douyin", type: "social_media" };
  if (u.includes("bilibili") || u.includes("b23.tv")) return { name: "Bilibili", type: "social_media" };
  if (u.includes("baidu")) return { name: "BaiduImages", type: "website" };
  if (u.includes("google")) return { name: "GoogleImages", type: "website" };
  if (u.includes("taobao") || u.includes("tmall") || u.includes("jd.com")) return { name: "E-commerce", type: "ecommerce" };
  return { name: new URL(url).hostname, type: "website" };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
