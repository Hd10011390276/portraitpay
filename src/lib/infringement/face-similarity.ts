/**
 * Face Similarity Service
 *
 * Uses cosine similarity on registered face embeddings to detect potential
 * portrait infringement across the web.
 *
 * Architecture:
 * - Registered embeddings stored in Portrait.faceEmbedding (Float[])
 * - Monitoring crawl results come in as image URLs
 * - For each crawled image: extract embedding → cosine similarity → threshold filter
 *
 * Provider-agnostic: uses the same extractFaceEmbeddingAliyun() from @/lib/face
 * when FACE_PROVIDER=aliyun, or face-api.js for browser-side.
 */

import { cosineSimilarity } from "@/lib/face";
import { prisma } from "@/lib/prisma";

export interface SimilarityMatch {
  portraitId: string;
  ownerId: string;
  similarityScore: number; // 0–1
  embeddingSnapshot: number[];
}

/**
 * Search all registered portraits for faces similar to the given embedding.
 *
 * In production with pgvector:
 *   SELECT id, owner_id, face_embedding <=> '[0.1,...]' AS distance
 *   FROM "Portrait"
 *   WHERE status = 'ACTIVE' AND deleted_at IS NULL
 *   ORDER BY distance
 *   LIMIT 10;
 *
 * Until pgvector is enabled we do an in-process brute-force scan.
 * The caller should pass a pageSize to limit memory usage.
 */
export async function findSimilarPortraits(
  targetEmbedding: number[],
  options: {
    minScore?: number;       // default 0.85
    limit?: number;         // default 20
    excludePortraitIds?: string[];
    ownerId?: string;       // only match portraits owned by this user
  } = {}
): Promise<SimilarityMatch[]> {
  const { minScore = 0.85, limit = 20, excludePortraitIds = [], ownerId } = options;

  // Build Prisma where clause
  const where: Record<string, unknown> = {
    status: "ACTIVE",
    deletedAt: null,
  };

  if (ownerId) where.ownerId = ownerId;

  // Load all active portraits (consider adding cursor-based pagination for scale)
  const portraits = await prisma.portrait.findMany({
    where,
    select: {
      id: true,
      ownerId: true,
      faceEmbedding: true,
    },
    take: 2000, // safety cap — replace with pgvector ANN query in production
  });

  const filtered = portraits.filter((p) => !excludePortraitIds.includes(p.id));

  const matches: SimilarityMatch[] = [];

  for (const portrait of filtered) {
    if (!portrait.faceEmbedding?.length) continue;

    const score = cosineSimilarity(targetEmbedding, portrait.faceEmbedding);
    if (score >= minScore) {
      matches.push({
        portraitId: portrait.id,
        ownerId: portrait.ownerId,
        similarityScore: score,
        embeddingSnapshot: portrait.faceEmbedding,
      });
    }
  }

  // Sort descending by similarity
  matches.sort((a, b) => b.similarityScore - a.similarityScore);
  return matches.slice(0, limit);
}

/**
 * Extract face embedding from an image URL using Aliyun.
 * Returns null if no face detected or on error.
 */
export async function extractEmbeddingFromUrl(
  imageUrl: string
): Promise<number[] | null> {
  try {
    const { extractFaceEmbeddingAliyun } = await import("@/lib/face");

    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());

    const result = await extractFaceEmbeddingAliyun(buffer);
    return result.embedding;
  } catch (err) {
    console.error("[FaceSimilarity] Failed to extract embedding from URL:", err);
    return null;
  }
}

/**
 * Batch similarity check — given a list of image URLs, find all matches
 * above the similarity threshold.
 *
 * Returns a map of URL → matched portraits.
 */
export async function batchSimilarityCheck(
  imageUrls: string[],
  options: {
    minScore?: number;
    ownerId?: string;
  } = {}
): Promise<Map<string, SimilarityMatch[]>> {
  const results = new Map<string, SimilarityMatch[]>();

  await Promise.allSettled(
    imageUrls.map(async (url) => {
      const embedding = await extractEmbeddingFromUrl(url);
      if (!embedding) return;

      const matches = await findSimilarPortraits(embedding, {
        minScore: options.minScore,
        excludePortraitIds: [],
        ownerId: options.ownerId,
      });

      if (matches.length > 0) {
        results.set(url, matches);
      }
    })
  );

  return results;
}
