/**
 * Aliyun Visual Intelligence Platform — Face Comparison (人脸比对1:1)
 *
 * Documentation: https://help.aliyun.com/zh/viapi/developer-reference/api-fomc02
 * Product: 视觉智能开放平台 facebody CompareFace API
 * Endpoint: facebody.cn-shanghai.aliyuncs.com (fixed region)
 * Auth: POP HMAC-SHA1 (same signing as face/compare/route.ts)
 *
 * No APP ID needed — uses AccessKey directly.
 * Free tier available at: https://vision.aliyun.com/facebody
 *
 * Image delivery: R2 URLs are inaccessible from outside Cloudflare.
 * When an R2 URL is detected, this module downloads the image via AWS SDK
 * (server-side, using env credentials) and sends it as ImageDataA/ImageDataB
 * (Base64) instead of ImageURLA/ImageURLB. See:
 * "ImageURLA与ImageDataA二选一，当URL方式与Base64编码方式共存时，URL方式优先。"
 * Since R2 URLs return 400 from external networks, we send ONLY Base64.
 */

import type {
  KYCProviderClient,
  IDCardOCRResult,
  FaceVerifyResult,
  KYCLevel,
  KYCState,
} from "../types";

// ─── R2 image download helper ───────────────────────────────────────
// Vercel server-side can reach R2 via AWS SDK. We use ImageDataA/B
// (Base64) instead of ImageURLA/ImageURLB since R2 S3 URLs return 400
// from external networks (Aliyun). The Base64 takes priority over URL
// when both are absent (the API docs say URL "takes priority" only
// when both ImageURLA AND ImageDataA are present — if only ImageDataA
// is set, it uses Base64).

async function imageUrlToBase64(url: string): Promise<string> {
  // Only process R2 Cloudflare Storage URLs
  if (!url || !url.includes(".r2.cloudflarestorage.com")) {
    return url; // return as-is for non-R2 URLs (shouldn't happen)
  }

  try {
    // Extract the R2 key from the URL
    // URL format: https://{account}.r2.cloudflarestorage.com/{key}
    const urlObj = new URL(url);
    const key = urlObj.pathname.replace(/^\//, "");

    // Use AWS SDK to download from R2 (S3-compatible API)
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const config = {
      bucket: process.env.AWS_S3_BUCKET!,
      region: process.env.AWS_REGION ?? "auto",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      endpoint: process.env.AWS_ENDPOINT,
    };

    const client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    });

    const command = new GetObjectCommand({ Bucket: config.bucket, Key: key });
    const response = await client.send(command);

    if (!response.Body) {
      throw new Error(`Empty response from R2 for key: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const chunk of response.Body as any) {
      chunks.push(Buffer.from(chunk));
    }
    const imageBuffer = Buffer.concat(chunks);

    // Resize if too large (max 5MB per Aliyun limit, target 800×800 for face)
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB to leave room
    let buffer = imageBuffer;
    if (buffer.length > MAX_SIZE) {
      try {
        const sharp = (await import("sharp")).default;
        buffer = await sharp(buffer)
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch {
        // If sharp fails, still try with original (may exceed 5MB limit though)
        console.warn("[R2→Base64] sharp resize failed, using original buffer");
      }
    }

    console.log(`[R2→Base64] Downloaded ${key}: ${buffer.length} bytes`);
    return buffer.toString("base64");
  } catch (err) {
    console.error(`[R2→Base64] Failed to download ${url}:`, err);
    throw new Error("Failed to download image for face verification");
  }
}

// ============================================================
// Stub implementation (dev/demo) — replace with real Aliyun SDK calls
// ============================================================

// STUBS: dev/demo mode - set to false to enable real Aliyun API
// Must be false in production (with real KYC_ALIYUN_ACCESS_KEY_ID/SECRET)
// Set KYC_ALIYUN_STUB=true in development
// NOTE: isStubEnabled() is called at runtime (not module load) to ensure env var changes take effect
const STUBS = {
  autoApprove: true,
};

function isStubEnabled(): boolean {
  return process.env.KYC_ALIYUN_STUB === "true";
}

/**
 * Aliyun face verification client
 *
 * Real implementation requires:
 * 1. npm install @ AlibabaCloud/face-verification-sdk (or use REST API)
 * 2. Use VerifyToken / CompareFace / RecognizeIdentityCard from Aliyun SDK
 */
export class AliyunKYCProvider implements KYCProviderClient {
  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;
  private readonly region: string;

  constructor(opts: {
    accessKeyId: string;
    accessKeySecret: string;
    region?: string;
  }) {
    this.accessKeyId = opts.accessKeyId;
    this.accessKeySecret = opts.accessKeySecret;
    this.region = opts.region ?? "cn-shanghai";
  }

  // ─── 1. Initialize verification session ────────────────────

  async initSession(userId: string, _level: KYCLevel): Promise<{
    sessionToken: string;
    redirectUrl: string;
    externalRef: string;
  }> {
    // Visual Intelligence Platform uses CompareFace directly (no redirect flow)
    // The init session is a no-op; real verification happens in submitFaceVerify
    if (isStubEnabled() || !this.accessKeyId || !this.accessKeySecret) {
      const ref = `stub_${userId}_${Date.now()}`;
      return {
        sessionToken: ref,
        redirectUrl: `https://portraitpayai.com/kyc/callback?provider=aliyun&sessionId=${ref}`,
        externalRef: ref,
      };
    }

    const ref = `viapi_${userId}_${Date.now()}`;
    return {
      sessionToken: ref,
      redirectUrl: `https://portraitpayai.com/kyc/callback?provider=aliyun&sessionId=${ref}`,
      externalRef: ref,
    };
  }

  // ─── 2. ID Card OCR ─────────────────────────────────────────

  async submitOCR(
    idCardFrontUrl: string,
    idCardBackUrl: string
  ): Promise<IDCardOCRResult> {
    if (isStubEnabled() || !this.accessKeyId || !this.accessKeySecret) {
      console.log("[KYC STUB] submitOCR called, stub enabled, idCardFrontUrl:", idCardFrontUrl);
      return this.stubOCR();
    }

    /**
     * Real call: Aliyun OCR ID card recognition
     * POST https://ocr.{region}.aliyuncs.com/api/recognize/idcard
     * Or use: @ AlibabaCloud/ocr-api
     */
    throw new Error("Aliyun OCR not implemented — set KYC_ALIYUN_STUB=true for dev");
  }

  // ─── 3. Face verification (1:1 comparison) ─────────────────

  /**
   * Call Aliyun Visual Intelligence Platform CompareFace API
   * (人脸比对1:1 — 1:1 face comparison)
   *
   * API: POST https://facebody.cn-shanghai.aliyuncs.com/?Action=CompareFace
   * Auth: POP HMAC-SHA1 (RPC style)
   * Docs: https://help.aliyun.com/zh/viapi/developer-reference/api-fomc02
   *
   * @param portraitUrl  Portrait photo URL (R2 public URL)
   * @param idCardUrl    ID card photo URL (R2 public URL)
   */
  async submitFaceVerify(
    portraitUrl: string,
    idCardUrl: string
  ): Promise<FaceVerifyResult> {
    if (isStubEnabled() || !this.accessKeyId || !this.accessKeySecret) {
      console.log("[Aliyun VIAPI] submitFaceVerify: using STUB");
      return this.stubFaceVerify();
    }

    console.log("[Aliyun VIAPI] submitFaceVerify: calling CompareFace API");
    console.log("[Aliyun VIAPI]   portraitUrl:", portraitUrl);
    console.log("[Aliyun VIAPI]   idCardUrl:", idCardUrl);

    // Fixed endpoint: facebody.cn-shanghai.aliyuncs.com (NOT {region} placeholder)
    const host = "facebody.cn-shanghai.aliyuncs.com";
    const action = "CompareFace";
    const version = "2019-12-30";
    const timestamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const nonce = crypto.randomUUID();

    // ── Resolve image data (R2 → Base64, or pass-through) ───
    // R2 URLs are inaccessible from Aliyun's network — convert to Base64.
    // For non-R2 URLs (e.g. Aliyun OSS), use ImageURLA/ImageURLB directly.
    const isR2Portrait = portraitUrl.includes(".r2.cloudflarestorage.com");
    const isR2IdCard = idCardUrl.includes(".r2.cloudflarestorage.com");

    let imageDataA: string | undefined;
    let imageDataB: string | undefined;

    if (isR2Portrait) {
      imageDataA = await imageUrlToBase64(portraitUrl);
    }
    if (isR2IdCard) {
      imageDataB = await imageUrlToBase64(idCardUrl);
    }

    // ── POP HMAC-SHA1 signature (RPC style, RFC 3986) ────────
    // See: https://help.aliyun.com/document_detail/299225.html
    //
    // Algorithm:
    // 1. Build CanonicalizedQueryString: sorted key=value pairs (both key AND value percent-encoded)
    // 2. StringToSign = HTTPMethod + "&" + percentEncode("/") + "&" + percentEncode(CanonicalizedQueryString)
    // 3. HMAC-SHA1(key=AccessKeySecret+"&", data=StringToSign) → base64
    // 4. Append raw query string + Signature to URL
    //
    // Note: When ImageDataA is set (no ImageURLA), Base64 is used.
    // "ImageURLA与ImageDataA二选一，当URL方式与Base64编码方式共存时，URL方式优先。"
    const sortedParams = new URLSearchParams({
      SignatureMethod: "HMAC-SHA1",
      SignatureNonce: nonce,
      AccessKeyId: this.accessKeyId,
      SignatureVersion: "1.0",
      Timestamp: timestamp,
      Format: "JSON",
      RegionId: this.region,
      Version: version,
      Action: action,
      // Only include URL params when NOT using Base64 for that image
      ...(imageDataA ? {} : { ImageURLA: portraitUrl }),
      ...(imageDataB ? {} : { ImageURLB: idCardUrl }),
      // Include Base64 data when available (takes effect because no URL param for same slot)
      ...(imageDataA ? { ImageDataA: imageDataA } : {}),
      ...(imageDataB ? { ImageDataB: imageDataB } : {}),
    });

    const sortedKeys = Array.from(sortedParams.keys()).sort();

    // Build canonical query string: percentEncode(key)=percentEncode(value), joined by &
    const rfcEncode = (v: string) =>
      encodeURIComponent(v)
        .replace(/\+/g, "%20")
        .replace(/\*/g, "%2A")
        .replace(/%7E/g, "~");

    const canonicalQS = sortedKeys
      .map(k => `${rfcEncode(k)}=${rfcEncode(sortedParams.get(k) ?? "")}`)
      .join("&");

    // StringToSign = POST + "&" + percentEncode("/") + "&" + percentEncode(canonicalQS)
    const stringToSign = [
      "POST",
      rfcEncode("/"),
      rfcEncode(canonicalQS),
    ].join("&");

    const signKey = this.accessKeySecret + "&";
    const keyBuf = new TextEncoder().encode(signKey);
    const dataBuf = new TextEncoder().encode(stringToSign);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyBuf, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
    const signature = Buffer.from(sig).toString("base64");

    // Build URL: raw query string + Signature
    const urlParams = new URLSearchParams();
    sortedKeys.forEach(k => urlParams.append(k, sortedParams.get(k) ?? ""));
    urlParams.append("Signature", signature);
    const url = `https://${host}/?${urlParams.toString()}`;

    // ── Make request ─────────────────────────────────────────
    let resp: Record<string, unknown>;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[Aliyun VIAPI] CompareFace HTTP error:", res.status, text);
        throw new Error(`Face verification API error ${res.status}: ${text}`);
      }

      resp = await res.json() as Record<string, unknown>;
      console.log("[Aliyun VIAPI] CompareFace raw response:", JSON.stringify(resp));
    } catch (err) {
      console.error("[Aliyun VIAPI] CompareFace request failed:", err);
      throw new Error("Face verification request failed, please try again later");
    }

    // ── Parse result ────────────────────────────────────────
    // Response fields: Data.Confidence (0-100), Data.Thresholds [61,69,75]
    // No "Similarity" field — Confidence is the score we need.
    // See: https://help.aliyun.com/zh/viapi/developer-reference/api-fomc02
    const confidence = (resp.Data as Record<string, unknown>)?.Confidence as number
      ?? (resp.Confidence as number)
      ?? 0;

    const thresholds = (resp.Data as Record<string, unknown>)?.Thresholds as number[]
      ?? [61, 69, 75];

    console.log(`[Aliyun VIAPI] Confidence: ${confidence}, Thresholds: ${thresholds.join(",")}`);

    // Default threshold: >61 = same person (FAR 1/1000)
    // For higher security use 69 (FAR 1/10000) or 75 (FAR 1/100000)
    const passThreshold = thresholds[0] ?? 61;
    const verifyResult: "PASS" | "FAIL" | "REVIEW" =
      confidence >= passThreshold ? "PASS" : confidence >= passThreshold * 0.8 ? "REVIEW" : "FAIL";

    // No separate liveness check in CompareFace — use confidence as liveness proxy
    const livenessResult: "PASS" | "FAIL" = confidence >= 50 ? "PASS" : "FAIL";

    return {
      verifyScore: Math.round(confidence),
      verifyResult,
      similarity: Math.round(confidence) / 100,
      livenessScore: Math.round(confidence) / 100,
      livenessResult,
    };
  }

  private async _encode(value: string): Promise<string> {
    return encodeURIComponent(value)
      .replace(/\+/g, "%20")
      .replace(/\*/g, "%2A")
      .replace(/~/g, "%7E");
  }

  // ─── 4. Query status ────────────────────────────────────────

  async queryStatus(externalRef: string): Promise<{
    status: "PENDING" | "APPROVED" | "REJECTED";
    result?: IDCardOCRResult & FaceVerifyResult;
  }> {
    if (isStubEnabled() || !this.accessKeyId || !this.accessKeySecret) {
      return STUBS.autoApprove
        ? { status: "APPROVED", result: { ...this.stubOCR(), ...this.stubFaceVerify() } }
        : { status: "PENDING" };
    }

    /**
     * Real call: POST https://faceverification.{region}.aliyuncs.com/
     * { "TicketId": externalRef, "ProductKey": this.appId }
     */
    throw new Error("Aliyun queryStatus not implemented — set KYC_ALIYUN_STUB=true for dev");
  }

  // ─── 5. Handle webhook ─────────────────────────────────────

  async handleWebhook(payload: Record<string, unknown>): Promise<{
    userId: string;
    status: KYCState;
    externalRef: string;
    result?: IDCardOCRResult & FaceVerifyResult;
  }> {
    // Aliyun callback format example
    // { "TicketId": "...", "Status": "PASS", "Reason": "...", "VerifyResult": {...} }
    const status = payload["Status"] as string;
    const userId = payload["userId"] as string ?? "unknown";
    const externalRef = payload["TicketId"] as string ?? "";

    const stateMap: Record<string, KYCState> = {
      PASS: "APPROVED",
      FAIL: "REJECTED",
      REVIEW: "PENDING",
    };

    return {
      userId,
      status: stateMap[status] ?? "PENDING",
      externalRef,
    };
  }

  // ─── Stub methods ───────────────────────────────────────────

  private stubOCR(): IDCardOCRResult {
    console.log("[KYC STUB] stubOCR called, stub enabled:", isStubEnabled());
    return {
      name: "John Doe",
      gender: "male",
      ethnicity: "Han",
      birthDate: "1990-01-01",
      address: "123 Main St, Los Angeles, CA",
      idCardNumber: "US123456789",
      authority: "Los Angeles DMV",
      expireDate: "2030-01-01",
      confidence: { name: 99.8, idCardNumber: 99.9, address: 98.5 },
    };
  }

  private stubFaceVerify(): FaceVerifyResult {
    return {
      verifyScore: 98.5,
      verifyResult: "PASS",
      similarity: 0.985,
      livenessScore: 0.99,
      livenessResult: "PASS",
    };
  }
}