/**
 * Celebrity Face Database — Stub
 *
 * Currently uses locally-defined mock embeddings for demonstration.
 * In production, replace with a real database query (pgvector / Pinecone / Qdrant)
 * that stores high-dimensional face embeddings for registered celebrities.
 *
 * Future integration point:
 *   POST /api/face-trace/trace → calls a service that queries the DB
 *   The DB stores 128-d face descriptors (from face-api.js TinyFaceDetector + FaceRecognitionNet)
 *   or 512-d from Aliyun/face++.
 *
 * Celebrity records should have:
 *   - id: unique identifier
 *   - name: celebrity full name
 *   - category: "athlete" | "musician" | "actor" | "politician" | "creator" | ...
 *   - faceEmbedding: number[] (128-d or 512-d vector)
 *   - ownershipStatus: "claimed" | "pending" | "unclaimed"
 *   - claimable: boolean — whether the platform supports licensing
 *   - imageUrl: reference image (optional)
 */

export type OwnershipStatus = "claimed" | "pending" | "unclaimed";

export interface CelebrityRecord {
  id: string;
  name: string;
  category: string;
  /** 128-d face descriptor (face-api.js FaceRecognitionNet) */
  faceEmbedding: number[];
  ownershipStatus: OwnershipStatus;
  claimable: boolean;
  /** Reference image URL */
  imageUrl?: string;
  /** Public note */
  note?: string;
}

// ─────────────────────────────────────────────
// Mock Celebrity Database
// Embeddings are illustrative — generated with face-api.js in production
// ─────────────────────────────────────────────
const MOCK_CELEBRITIES: CelebrityRecord[] = [
  {
    id: "cel_001",
    name: "Taylor Swift",
    category: "musician",
    // 128-d stub vector (real embedding comes from face-api.js registration flow)
    faceEmbedding: Array.from({ length: 128 }, (_, i) =>
      Math.sin(i * 0.3 + 1) * 0.5 + Math.cos(i * 0.1) * 0.3
    ),
    ownershipStatus: "claimed",
    claimable: true,
    note: "Official licensing via PortraitPay",
  },
  {
    id: "cel_002",
    name: "Cristiano Ronaldo",
    category: "athlete",
    faceEmbedding: Array.from({ length: 128 }, (_, i) =>
      Math.cos(i * 0.25 + 2) * 0.5 + Math.sin(i * 0.15) * 0.3
    ),
    ownershipStatus: "claimed",
    claimable: true,
    note: "Sports portrait rights managed by agency",
  },
  {
    id: "cel_003",
    name: "Lionel Messi",
    category: "athlete",
    faceEmbedding: Array.from({ length: 128 }, (_, i) =>
      Math.sin(i * 0.2 + 0.5) * 0.5 + Math.cos(i * 0.12) * 0.35
    ),
    ownershipStatus: "pending",
    claimable: true,
    note: "Pending official verification",
  },
  {
    id: "cel_004",
    name: "Meryl Streep",
    category: "actor",
    faceEmbedding: Array.from({ length: 128 }, (_, i) =>
      Math.cos(i * 0.18 + 3) * 0.4 + Math.sin(i * 0.08) * 0.4
    ),
    ownershipStatus: "unclaimed",
    claimable: false,
    note: "Not currently registered on platform",
  },
  {
    id: "cel_005",
    name: "LeBron James",
    category: "athlete",
    faceEmbedding: Array.from({ length: 128 }, (_, i) =>
      Math.sin(i * 0.22 + 1.5) * 0.5 + Math.cos(i * 0.1) * 0.3
    ),
    ownershipStatus: "claimed",
    claimable: true,
    note: "Official licensing via NBA Players Association",
  },
  {
    id: "cel_006",
    name: "Beyoncé",
    category: "musician",
    faceEmbedding: Array.from({ length: 128 }, (_, i) =>
      Math.cos(i * 0.28 + 0.8) * 0.45 + Math.sin(i * 0.13) * 0.35
    ),
    ownershipStatus: "claimed",
    claimable: true,
    note: "Official portrait rights managed by Roc Nation",
  },
  {
    id: "cel_007",
    name: "Tom Holland",
    category: "actor",
    faceEmbedding: Array.from({ length: 128 }, (_, i) =>
      Math.sin(i * 0.15 + 2.2) * 0.5 + Math.cos(i * 0.07) * 0.3
    ),
    ownershipStatus: "unclaimed",
    claimable: false,
    note: "Not currently registered on platform",
  },
  {
    id: "cel_008",
    name: "Zendaya",
    category: "actor",
    faceEmbedding: Array.from({ length: 128 }, (_, i) =>
      Math.cos(i * 0.21 + 1.2) * 0.4 + Math.sin(i * 0.09) * 0.35
    ),
    ownershipStatus: "pending",
    claimable: true,
    note: "Verification in progress",
  },
];

/**
 * Query the celebrity database for top-K similar faces.
 * Currently in-memory; swap for pgvector / ANN index in production.
 *
 * @param targetEmbedding  The 128-d query vector
 * @param topK              Number of results to return
 * @param minScore          Minimum cosine similarity (default 0.5)
 */
export async function queryCelebrityDb(
  targetEmbedding: number[],
  topK = 5,
  minScore = 0.5
): Promise<CelebrityMatch[]> {
  const { cosineSimilarity } = await import("@/lib/face");

  const scored = MOCK_CELEBRITIES.map((cel) => {
    let score = 0;
    try {
      score = cosineSimilarity(targetEmbedding, cel.faceEmbedding);
    } catch {
      score = 0;
    }
    return { ...cel, score };
  });

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, faceEmbedding: _faceEmbedding, ...cel }) => ({
      ...cel,
      similarityScore: Math.round(score * 1000) / 1000, // 3 decimal places
    }));
}

export interface CelebrityMatch extends Omit<CelebrityRecord, "faceEmbedding"> {
  similarityScore: number;
}
