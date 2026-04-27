/**
 * POST /api/face/compare
 *
 * Server-side face comparison using @vladmandic/face-api.
 *
 * Supports two modes:
 *  1. image mode (default): receives two image Files and compares them locally
 *     using @vladmandic/face-api + canvas. Requires the `canvas` npm package.
 *  2. embedding mode: receives pre-computed 128-dim face descriptors and
 *     compares them using cosine similarity (no canvas needed).
 *
 * Body (multipart/form-data — image mode):
 *   image1: File
 *   image2: File
 *
 * Body (application/json — embedding mode):
 *   { descriptor1: number[], descriptor2: number[] }
 *
 * Query params:
 *   mode=embedding | image   (default: image if files present, else embedding)
 *   threshold=0-100         (default: 60)
 *
 * Response:
 *   { success: true, score: number, result: "PASS"|"FAIL"|"REVIEW", provider: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_THRESHOLD = 60;

// ─── Cosine similarity (shared, no canvas needed) ────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function cosineToScore(cosine: number): number {
  return Math.round(((cosine + 1) / 2) * 100);
}

// ─── image → canvas (requires `canvas` npm package) ─────────────────────────

async function imageFileToCanvas(file: File): Promise<any> {
  // canvas is an optional peer dependency — fail gracefully if not installed
  let Canvas: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Canvas = require("canvas");
  } catch {
    throw new Error(
      "canvas npm package not installed. Install it with: npm install canvas\n" +
      "Or use /api/v1/face-compare which uses cloud providers instead."
    );
  }
  const buffer = await file.arrayBuffer();
  const img = await loadImageCanvas(Canvas, buffer);
  const canvas = Canvas.createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas;
}

async function loadImageCanvas(Canvas: any, buffer: ArrayBuffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Canvas.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = Buffer.from(buffer);
  });
}

async function extractDescriptorWithFaceApi(
  canvas: any,
): Promise<Float32Array> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const faceapi = require("@vladmandic/face-api");
  const tinyOptions = new faceapi.TinyFaceDetectorOptions();
  const detection = await faceapi
    .detectSingleFace(canvas, tinyOptions)
    .withFaceDescriptor();
  if (!detection?.descriptor) {
    throw new Error("No face detected in image");
  }
  return detection.descriptor;
}

async function compareImagesWithFaceApi(
  image1: File,
  image2: File,
  threshold: number,
): Promise<{ score: number; result: "PASS" | "FAIL"; provider: string }> {
  // Load models once (cached after first call)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const faceapi = require("@vladmandic/face-api");
  const modelUrl = process.env.FACE_API_MODEL_URL ?? "./public/models";

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
  ]);

  const canvas1 = await imageFileToCanvas(image1);
  const canvas2 = await imageFileToCanvas(image2);

  const [desc1, desc2] = await Promise.all([
    extractDescriptorWithFaceApi(canvas1),
    extractDescriptorWithFaceApi(canvas2),
  ]);

  const descArr1 = Array.from(desc1) as number[];
  const descArr2 = Array.from(desc2) as number[];
  const cosine = cosineSimilarity(descArr1, descArr2);
  const score = cosineToScore(cosine);

  return {
    score,
    result: score >= threshold ? "PASS" : "FAIL",
    provider: "face-api",
  };
}

// ─── Cloud provider fallback ─────────────────────────────────────────────────

async function compareWithCloudProvider(
  image1: File,
  image2: File,
  threshold: number,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  // Upload files to R2 to get public URLs
  const { uploadFile } = await import("@/lib/storage");
  const buf1 = Buffer.from(await image1.arrayBuffer());
  const buf2 = Buffer.from(await image2.arrayBuffer());
  const key1 = `temp/face/${Date.now()}-portrait.jpg`;
  const key2 = `temp/face/${Date.now()}-idcard.jpg`;
  const [url1, url2] = await Promise.all([
    uploadFile(buf1, key1, image1.type || "image/jpeg"),
    uploadFile(buf2, key2, image2.type || "image/jpeg"),
  ]);
  console.log("[face/compare] R2 URLs:", url1, url2);

  const provider = process.env.KYC_PROVIDER ?? "aliyun";
  if (provider === "aliyun") {
    return compareWithAliyun(url1, url2);
  } else if (provider === "tencent") {
    return compareWithTencent(url1, url2);
  }

  console.warn("[face/compare] No cloud credentials configured, returning FAIL");
  return { score: 0, result: "FAIL" as const, provider: "stub" };
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary).toString("base64");
}

async function specialUrlEncode(value: string): Promise<string> {
  return encodeURIComponent(value)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

async function compareWithAliyun(
  imageUrl1: string,
  imageUrl2: string,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  const region = process.env.KYC_ALIYUN_REGION ?? "cn-shanghai";

  if (!accessKeyId || !accessKeySecret) {
    console.warn("[face/compare] Aliyun credentials missing, returning FAIL");
    return { score: 0, result: "FAIL" as const, provider: "aliyun-stub" };
  }

  const host = `facebody.${region}.aliyuncs.com`;
  const action = "CompareFace";
  const version = "2019-12-30";
  const timestamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const nonce = crypto.randomUUID();

  // Build query params (alphabetically sorted, as required by POP signing)
  const params = new URLSearchParams({
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: nonce,
    AccessKeyId: accessKeyId,
    SignatureVersion: "1.0",
    Timestamp: timestamp,
    Format: "JSON",
    RegionId: region,
    Version: version,
    Action: action,
    ImageURL1: imageUrl1,
    ImageURL2: imageUrl2,
  });

  const sortedKeys = Array.from(params.keys()).sort();
  const sortedQueryString = sortedKeys.map(k => `${k}=${params.get(k)}`).join("&");

  // Build string to sign (POP style)
  const stringToSign = [
    "POST",
    await specialUrlEncode("/"),
    await specialUrlEncode(sortedQueryString),
  ].join("&");

  // HMAC-SHA1 sign
  const key = accessKeySecret + "&";
  const keyBuf = new TextEncoder().encode(key);
  const dataBuf = new TextEncoder().encode(stringToSign);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
  const signature = Buffer.from(sig).toString("base64");
  const encodedSig = await specialUrlEncode(signature);

  // Build final URL with signature
  const url = `https://${host}/?Signature=${encodedSig}&${sortedQueryString}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Aliyun API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  console.log("[face/compare] Aliyun response:", JSON.stringify(data));
  // Try multiple possible response shapes
  const similarity = data.Similarity ?? data.Data?.Similarity ?? data.data?.Similarity ?? 0;
  const result: "PASS" | "FAIL" | "REVIEW" =
    similarity >= 80 ? "PASS" : similarity >= 60 ? "REVIEW" : "FAIL";
  return { score: similarity, result, provider: "aliyun", _debug: data }; // TEMP DEBUG
}

async function compareWithTencent(
  imageUrl1: string,
  imageUrl2: string,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  const secretId = process.env.KYC_TENCENT_SECRET_ID;
  const secretKey = process.env.KYC_TENCENT_SECRET_KEY;
  const region = process.env.KYC_TENCENT_REGION ?? "ap-guangzhou";

  if (!secretId || !secretKey) {
    console.warn("[face/compare] Tencent credentials missing, returning FAIL");
    return { score: 0, result: "FAIL" as const, provider: "tencent-stub" };
  }

  // Fetch images from URLs and convert to base64
  const [buf1, buf2] = await Promise.all([
    fetch(imageUrl1).then(r => r.arrayBuffer()),
    fetch(imageUrl2).then(r => r.arrayBuffer()),
  ]);
  const portraitBase64 = Buffer.from(buf1).toString("base64");
  const idCardBase64 = Buffer.from(buf2).toString("base64");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Math.floor(Math.random() * 99999999).toString();

  const host = "faceid.faceid.tencentcloudapi.com";
  const action = "CompareFace";
  const version = "2018-03-01";
  const payload = JSON.stringify({ ImageA: portraitBase64, ImageB: idCardBase64 });

  const headers = {
    "Content-Type": "application/json",
    Host: host,
    "X-TC-Action": action,
    "X-TC-Version": version,
    "X-TC-Timestamp": timestamp,
    "X-TC-Region": region,
  };

  const signature = await tencentSign({ secretKey, service: "faceid", host, action, version, timestamp, nonce, payload });

  const res = await fetch(`https://${host}/`, {
    method: "POST",
    headers: { ...headers, "X-TC-Signature": signature, "X-TC-Key": secretId, "X-TC-Nonce": nonce },
    body: payload,
  });

  if (!res.ok) {
    throw new Error(`Tencent API error ${res.status}`);
  }

  const data = await res.json();
  const similarity = data.Response?.Similarity ?? 0;
  const resultCode = data.Response?.Result ?? "-1";
  const result: "PASS" | "FAIL" | "REVIEW" =
    resultCode === "0" ? "PASS" : resultCode === "-2" ? "REVIEW" : "FAIL";
  return { score: similarity, result, provider: "tencent" };
}

async function tencentSign(opts: {
  secretKey: string; service: string; host: string; action: string;
  version: string; timestamp: string; nonce: string; payload: string;
}): Promise<string> {
  const { secretKey, service, host, action, version, timestamp, nonce, payload } = opts;
  const httpRequestMethod = "POST";
  const canonicalUri = "/";
  const canonicalQueryString = "";
  const canonicalHeaders = `content-type:application/json\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  const hashedPayload = await sha256Base64(payload);
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  const algorithm = "TC3-HMAC-SHA256";
  const date = new Date(parseInt(timestamp) * 1000).toISOString().split("T")[0];
  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonicalRequest = await sha256Base64(canonicalRequest);
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  const kDate = await hmacSha256(secretKey, date);
  const kService = await hmacSha256(Buffer.from(kDate).toString("binary"), service);
  const kSigning = await hmacSha256(Buffer.from(kService).toString("binary"), "tc3_request");
  const signature = await hmacSha256(Buffer.from(kSigning).toString("binary"), stringToSign);
  return Buffer.from(signature).toString("base64");
}

async function hmacSha256(key: string, data: string): Promise<ArrayBuffer> {
  const keyBuf = new TextEncoder().encode(key);
  const dataBuf = new TextEncoder().encode(data);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Optional auth: allow unauthenticated for public comparison
    // await getSessionFromRequest(req);

    const contentType = req.headers.get("content-type") ?? "";
    const threshold = parseInt(req.nextUrl.searchParams.get("threshold") ?? String(DEFAULT_THRESHOLD), 10);
    const mode = req.nextUrl.searchParams.get("mode") ?? "auto";

    // Debug: check env vars
    if (mode === "debug") {
      return NextResponse.json({
        aliyunKeyId: !!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        aliyunKeyIdLen: (process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || "").length,
        aliyunKeySecret: !!process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
        kycProvider: process.env.KYC_PROVIDER || "(not set)",
        kycAliyunKeyId: !!process.env.KYC_ALIYUN_ACCESS_KEY_ID,
        kycAliyunKeySecret: !!process.env.KYC_ALIYUN_ACCESS_KEY_SECRET,
        tencentSecretId: !!process.env.KYC_TENCENT_SECRET_ID,
      });
    }

    // ── Embedding mode (JSON) ──────────────────────────────────────────────
    if (contentType.includes("application/json") || mode === "embedding") {
      let body: { descriptor1?: number[]; descriptor2?: number[] };
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
      }

      const { descriptor1, descriptor2 } = body;
      if (!Array.isArray(descriptor1) || !Array.isArray(descriptor2)) {
        return NextResponse.json(
          { success: false, error: "descriptor1 and descriptor2 (number[]) are required in embedding mode" },
          { status: 400 }
        );
      }
      if (descriptor1.length !== 128 || descriptor2.length !== 128) {
        return NextResponse.json(
          { success: false, error: "Descriptors must be 128-dimensional (face-api.js default)" },
          { status: 400 }
        );
      }

      const cosine = cosineSimilarity(descriptor1, descriptor2);
      const score = cosineToScore(cosine);
      return NextResponse.json({
        success: true,
        score,
        result: score >= threshold ? "PASS" : "FAIL",
        provider: "cosine-similarity",
      });
    }

    // ── Image mode (multipart/form-data) ───────────────────────────────────
    let image1: File | null = null;
    let image2: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      image1 = formData.get("image1") as File | null;
      image2 = formData.get("image2") as File | null;
      // Also support portrait/idCard naming convention from upload page
      if (!image1) image1 = formData.get("portrait") as File | null;
      if (!image2) image2 = formData.get("idCard") as File | null;
    }

    if (!image1 || !image2) {
      return NextResponse.json(
        { success: false, error: "image1 and image2 (or portrait and idCard) files are required" },
        { status: 400 }
      );
    }

    if (!image1.type.startsWith("image/") || !image2.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Both files must be images" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (image1.size > MAX_SIZE || image2.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    // ── Try face-api.js + canvas first ─────────────────────────────────────
    let result: { score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string };
    let faceApiFailed = false;

    if (mode === "image" || mode === "auto") {
      try {
        console.log("[face/compare] Attempting face-api.js comparison...");
        const faceApiResult = await compareImagesWithFaceApi(image1, image2, threshold);
        console.log(`[face/compare] face-api.js score=${faceApiResult.score}`);
        return NextResponse.json({ success: true, ...faceApiResult });
      } catch (err) {
        faceApiFailed = true;
        console.warn("[face/compare] face-api.js failed, falling back to cloud provider:", err);
      }
    }

    // ── Fall back to cloud provider ───────────────────────────────────────
    try {
      const provider = process.env.KYC_PROVIDER ?? "aliyun";
      console.log("[face/compare] Cloud fallback: provider=", provider);
      result = await compareWithCloudProvider(image1, image2, threshold);
      console.log("[face/compare] Cloud result:", result);
    } catch (err) {
      console.error("[face/compare] Cloud provider comparison failed, returning FAIL:", err);
      result = { score: 0, result: "FAIL" as const, provider: "stub" };
    }

    console.log(`[face/compare] Final result: provider=${result.provider} score=${result.score}`);
    // Debug mode: return env status
    if (req.nextUrl.searchParams.get("debug") === "1") {
      return NextResponse.json({
        aliyunKeyId: !!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        aliyunKeyIdLen: (process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || "").length,
        aliyunKeySecret: !!process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
        kycProvider: process.env.KYC_PROVIDER || "(not set)",
        kycAliyunKeyId: !!process.env.KYC_ALIYUN_ACCESS_KEY_ID,
        kycAliyunKeySecret: !!process.env.KYC_ALIYUN_ACCESS_KEY_SECRET,
        tencentSecretId: !!process.env.KYC_TENCENT_SECRET_ID,
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[face/compare] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Face comparison failed" },
      { status: 500 }
    );
  }
}
