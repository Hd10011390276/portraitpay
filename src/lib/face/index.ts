/**
 * Face utilities — @vladmandic/face-api wrappers + helpers.
 *
 * Client-side (browser): use extractFaceDescriptor() directly with canvas.
 * Server-side (Node.js): use the /api/face/compare route instead, which
 * handles canvas initialization and model loading.
 */

export interface FaceEmbeddingResult {
  embedding: number[];
  provider: string;
}

export interface FaceCompareResult {
  score: number;       // 0-100 similarity score
  result: "PASS" | "FAIL" | "REVIEW";
  provider: string;
  error?: string;
}

/**
 * Convert a face-api descriptor Float32Array to a plain number array.
 * Used by FaceApiDetector and FaceTraceUploader.
 */
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

/**
 * Compute cosine similarity between two face embedding vectors.
 * Returns a value between -1 and 1 (higher = more similar).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Convert cosine similarity (-1..1) to a 0-100 score.
 */
export function cosineToScore(cosine: number): number {
  // Map [-1, 1] → [0, 100]
  return Math.round(((cosine + 1) / 2) * 100);
}

// ─── face-api.js client-side helpers ───────────────────────────────────────

const FACE_MODEL_URL = "/models";

/**
 * Load face-api.js models (browser-only).
 * Safe to call multiple times — models are cached in the face-api registry.
 */
export async function loadFaceModels(): Promise<void> {
  const faceapi = await import("@vladmandic/face-api");
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL),
  ]);
}

/**
 * Extract a 128-dimension face descriptor from an image File (browser-only).
 * Uses tinyFaceDetector + faceLandmark68 + faceRecognitionNet.
 *
 * @param file - Image File or Blob
 * @returns Float32Array of 128 face descriptor values
 * @throws Error if no face is detected or descriptor cannot be extracted
 */
export async function extractFaceDescriptor(file: File | Blob): Promise<Float32Array> {
  const faceapi = await import("@vladmandic/face-api");
  await loadFaceModels();

  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const tinyOptions = new faceapi.TinyFaceDetectorOptions();
  const detection = await faceapi
    .detectSingleFace(canvas, tinyOptions)
    .withFaceDescriptor();

  if (!detection?.descriptor) {
    throw new Error("No face detected or descriptor could not be extracted");
  }
  return detection.descriptor;
}

/**
 * Compare two face images and return a similarity score (browser-only).
 * Convenience wrapper around extractFaceDescriptor + cosineToScore.
 *
 * @param file1 First image File
 * @param file2 Second image File
 * @param threshold Score threshold (0-100) to determine PASS/FAIL (default 60)
 * @returns FaceCompareResult with score and PASS/FAIL result
 */
export async function compareFaces(
  file1: File | Blob,
  file2: File | Blob,
  threshold = 60
): Promise<FaceCompareResult> {
  try {
    const [desc1, desc2] = await Promise.all([
      extractFaceDescriptor(file1),
      extractFaceDescriptor(file2),
    ]);
    const cosine = cosineSimilarity(descriptorToArray(desc1), descriptorToArray(desc2));
    const score = cosineToScore(cosine);
    return {
      score,
      result: score >= threshold ? "PASS" : "FAIL",
      provider: "face-api",
    };
  } catch (err) {
    return {
      score: 0,
      result: "FAIL",
      provider: "face-api",
      error: err instanceof Error ? err.message : "Face comparison failed",
    };
  }
}

/**
 * Extract face embedding using Aliyun API format (stub).
 * In production this calls the Aliyun face API.
 */
export async function extractFaceEmbeddingAliyun(_imageBuffer: Buffer): Promise<FaceEmbeddingResult> {
  const zeros = new Float32Array(512).fill(0);
  return { embedding: Array.from(zeros), provider: "aliyun" };
}
