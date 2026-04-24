/**
 * API Key Utilities for PortraitPay
 *
 * Provides functions for:
 * - Generating API keys with format sk_live_xxxx or sk_test_xxxx
 * - Hashing API keys (SHA-256) for secure storage
 * - Verifying API keys against stored hashes
 * - Rate limiting based on API key configuration
 */

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// API Key format: sk_live_xxxx or sk_test_xxxx (32 bytes of random data base62 encoded)
const API_KEY_PREFIX_LIVE = "sk_live_";
const API_KEY_PREFIX_TEST = "sk_test_";
const API_KEY_LENGTH = 32; // 32 bytes of random data

/**
 * Generate a random API key with prefix
 * @param testMode - if true, generates sk_test_ prefix, otherwise sk_live_
 * @returns raw API key (only returned once, never stored)
 */
export function generateApiKey(testMode = false): string {
  const prefix = testMode ? API_KEY_PREFIX_TEST : API_KEY_PREFIX_LIVE;
  const randomPart = randomBytes(API_KEY_LENGTH).toString("base64url");
  return `${prefix}${randomPart}`;
}

/**
 * Hash an API key using SHA-256
 * @param apiKey - raw API key
 * @returns hash in hex format
 */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Extract prefix from API key for display
 * @param apiKey - raw API key
 * @returns prefix like "sk_live_" or "sk_test_"
 */
export function getKeyPrefix(apiKey: string): string {
  if (apiKey.startsWith(API_KEY_PREFIX_LIVE)) return API_KEY_PREFIX_LIVE;
  if (apiKey.startsWith(API_KEY_PREFIX_TEST)) return API_KEY_PREFIX_TEST;
  return "";
}

/**
 * Validate API key format
 * @param apiKey - raw API key to validate
 * @returns true if format is valid
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey) return false;
  const isLive = apiKey.startsWith(API_KEY_PREFIX_LIVE);
  const isTest = apiKey.startsWith(API_KEY_PREFIX_TEST);
  if (!isLive && !isTest) return false;
  // After prefix, should be base64url encoded 32 bytes
  const randomPart = isLive
    ? apiKey.slice(API_KEY_PREFIX_LIVE.length)
    : apiKey.slice(API_KEY_PREFIX_TEST.length);
  return randomPart.length >= API_KEY_LENGTH;
}

/**
 * Verify an API key and return the associated API key record and user
 * @param apiKey - raw API key from request
 * @returns API key record with user if valid, null otherwise
 */
export async function verifyApiKey(apiKey: string) {
  if (!apiKey || !isValidApiKeyFormat(apiKey)) {
    return null;
  }

  const keyHash = hashApiKey(apiKey);

  const record = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          displayName: true,
        },
      },
    },
  });

  if (!record) {
    return null;
  }

  // Check if API key is active
  if (record.status !== "ACTIVE") {
    return null;
  }

  // Check expiration
  if (record.expiresAt && new Date() > record.expiresAt) {
    return null;
  }

  // Update last used timestamp and increment request count
  await prisma.apiKey.update({
    where: { id: record.id },
    data: {
      lastUsedAt: new Date(),
      requestCount: { increment: 1 },
    },
  });

  return { apiKeyRecord: record, user: record.user };
}

/**
 * Check rate limit for an API key
 * @param apiKeyId - API key ID to check
 * @param rateLimitPerMinute - configured rate limit
 * @returns true if within limit, false if exceeded
 */
export async function checkRateLimit(
  apiKeyId: string,
  rateLimitPerMinute: number
): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setSeconds(0, 0);

  const record = await prisma.rateLimitRecord.findUnique({
    where: {
      identifier_windowStart: {
        identifier: `api_key:${apiKeyId}`,
        windowStart,
      },
    },
  });

  if (!record) {
    // Create new record
    await prisma.rateLimitRecord.create({
      data: {
        identifier: `api_key:${apiKeyId}`,
        windowStart,
        requestCount: 1,
      },
    });
    return true;
  }

  if (record.requestCount >= rateLimitPerMinute) {
    return false;
  }

  // Increment counter
  await prisma.rateLimitRecord.update({
    where: { id: record.id },
    data: { requestCount: { increment: 1 } },
  });

  return true;
}

/**
 * Create a new API key for a user
 * @param userId - user ID
 * @param name - friendly name for the API key
 * @param scopes - permission scopes
 * @param testMode - if true, creates test API key
 * @param expiresAt - optional expiration date
 * @returns created API key record and raw key (only available once)
 */
export async function createApiKey(
  userId: string,
  name: string,
  scopes: string[] = [],
  testMode = false,
  expiresAt?: Date
): Promise<{ record: Awaited<ReturnType<typeof prisma.apiKey.findUnique>>; rawKey: string }> {
  const rawKey = generateApiKey(testMode);
  const keyHash = hashApiKey(rawKey);
  const prefix = getKeyPrefix(rawKey);

  const record = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash,
      keyPrefix: prefix,
      scopes,
      expiresAt,
      status: "ACTIVE",
      rateLimitPerMinute: 60,
    },
  });

  return { record, rawKey };
}

/**
 * Revoke an API key
 * @param apiKeyId - API key ID to revoke
 * @param userId - user ID (for ownership verification)
 */
export async function revokeApiKey(
  apiKeyId: string,
  userId: string
): Promise<boolean> {
  const record = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
  });

  if (!record || record.userId !== userId) {
    return false;
  }

  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { status: "REVOKED" },
  });

  return true;
}
