/**
 * Face embedding extraction utilities
 *
 * Supports two backends:
 * 1. face-api.js  — browser-side ML (TensorFlow.js), no API key needed
 * 2. Aliyun Face Verify — server-side API (https://help.aliyun.com/document_detail/289658.html)
 *
 * Set FACE_PROVIDER="face-api" or "aliyun" in .env
 */

export interface FaceEmbeddingResult {
  embedding: number[]; // 128-d or 512-d vector
  provider: "face-api" | "aliyun";
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type FaceProvider = "face-api" | "aliyun";

/**
 * Get configured face provider from env
 */
export function getFaceProvider(): FaceProvider {
  const provider = process.env.FACE_PROVIDER ?? "face-api";
  if (provider !== "face-api" && provider !== "aliyun") {
    throw new Error(`Invalid FACE_PROVIDER: ${provider}. Use "face-api" or "aliyun"`);
  }
  return provider;
}

// ─────────────────────────────────────────────
// face-api.js — Browser-side (client component)
// Returns descriptor as Float32Array
// ─────────────────────────────────────────────

export interface FaceApiFaceDescriptor {
  descriptor: Float32Array; // 128-d face descriptor
  alignedRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Convert Float32Array to plain number array for DB storage
 */
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

/**
 * Convert plain number array back to Float32Array
 */
export function arrayToDescriptor(arr: number[]): Float32Array {
  return new Float32Array(arr);
}

// ─────────────────────────────────────────────
// Aliyun Face Verify — Server-side
// Ref: https://help.aliyun.com/document_detail/289658.html
// ─────────────────────────────────────────────

export interface AliyunFaceVerifyParams {
  imageUrl?: string;
  imageData?: string; // Base64 encoded image
}

export interface AliyunFaceVerifyResult {
  /** "true" = face detected */
  faceDetected: boolean;
  /** Confidence 0-100 */
  confidence: number;
  /** 512-d face feature vector, base64 encoded */
  feature: string;
  rect?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * Call Aliyun Face Verify API to extract face embedding
 * Ref: https://help.aliyun.com/document_detail/289658.html
 */
export async function extractFaceEmbeddingAliyun(
  imageBuffer: Buffer,
  options: { faceCount?: number } = {}
): Promise<FaceEmbeddingResult> {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY;
  const accessKeySecret = process.env.ALIYUN_ACCESS_SECRET;
  const region = process.env.ALIYUN_REGION ?? "cn-shanghai";
  const endpoint = process.env.ALIYUN_FACE_VERIFY_ENDPOINT ?? "face.cn-shanghai.aliyuncs.com";

  if (!accessKeyId || !accessKeySecret) {
    throw new Error(
      "Aliyun credentials not configured. Set ALIYUN_ACCESS_KEY, ALIYUN_ACCESS_SECRET, ALIYUN_REGION in .env"
    );
  }

  // Import Aliyun SDK dynamically (avoid top-level import of heavy SDK)
  const { DefaultApi, Configuration } = await import("./aliyun-stub");

  const config = new Configuration({
    accessKeyId,
    accessKeySecret,
    region,
    endpoint,
  });

  const client = new DefaultApi(config);

  const base64Image = imageBuffer.toString("base64");

  const response = await client.detectFace({
    image: base64Image,
    // face_count: options.faceCount ?? 1,
  });

  if (!response.data || !response.data.faceList?.length) {
    throw new Error("No face detected in the image");
  }

  const face = response.data.faceList[0];

  // Feature vector is base64 encoded Float32 array (512-d)
  const featureBase64 = face.feature as unknown as string;
  const featureBuffer = Buffer.from(featureBase64, "base64");
  const featureArray = new Float32Array(featureBuffer.buffer, featureBuffer.byteOffset, featureBuffer.length / 4);

  return {
    embedding: Array.from(featureArray),
    provider: "aliyun",
    confidence: face.confidence ?? 0,
    boundingBox: face.rect
      ? { x: face.rect.x, y: face.rect.y, width: face.rect.w, height: face.rect.h }
      : undefined,
  };
}

/**
 * Compute cosine similarity between two face embeddings
 * Returns value in range [-1, 1], higher = more similar
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Embedding dimensions must match");

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Validate that image has exactly one face (for portrait registration)
 * Throws if 0 or >1 faces detected
 *
 * NOTE: This is a stub. Replace with actual face-api.js detectSingleFace
 * in the client component (browser environment required).
 */
export async function validateSingleFace(
  _imageBuffer: Buffer
): Promise<{ valid: boolean; faceCount: number }> {
  // In browser: use face-api.js detectAllFaces()
  // In server: call Aliyun / face++ API
  // Stub: always pass for now
  console.warn("[Face] validateSingleFace called on server — implement with Aliyun or face-api");
  return { valid: true, faceCount: 1 };
}
