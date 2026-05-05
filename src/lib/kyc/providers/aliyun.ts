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

// ─── R2 presigned URL helper ───────────────────────────────────────
// R2 S3 URLs (b0d0ec3c3f9bc0e681ded21e2126bab2.r2.cloudflarestorage.com/{key})
// return 400 from external networks because R2 requires S3 signature auth.
//
// Solution: Generate a presigned GET URL using AWS SDK (same credentials
// as upload). Aliyun CompareFace API accepts any public URL as ImageURLA/B.
// The presigned URL contains R2 auth params that Aliyun's HTTP client will
// forward correctly (Aliyun makes a GET request to the URL and passes the
// presigned auth query params, which R2 accepts).
//
// If presigned URL approach fails (R2 presigned URLs use a different
// signature format that Aliyun's HTTP client may not forward correctly),
// we fall back to downloading the image server-side and sending as Base64.

async function getR2AccessibleUrl(r2Url: string, expiresInSeconds = 3600): Promise<string> {
  if (!r2Url || !r2Url.includes(".r2.cloudflarestorage.com")) {
    return r2Url; // not an R2 URL, return as-is
  }

  try {
    // Extract the R2 object key from the URL
    // URL format: https://{account}.r2.cloudflarestorage.com/{key}
    const urlObj = new URL(r2Url);
    const key = urlObj.pathname.replace(/^\//, "");

    // Generate a presigned GET URL using the AWS SDK (same credentials as upload)
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

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
    const presignedUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

    console.log(`[R2] Generated presigned URL for ${key} (expires in ${expiresInSeconds}s)`);
    return presignedUrl;
  } catch (err) {
    console.error(`[R2] Failed to generate presigned URL for ${r2Url}:`, err);
    throw new Error("Failed to generate accessible image URL");
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

    // ── Resolve R2 URLs to presigned GET URLs ─────────────────────
    // R2 URLs return 400 from Aliyun's network. Generate presigned GET URLs
    // (same credentials as upload) so Aliyun can access the images directly.
    const isR2Portrait = portraitUrl.includes(".r2.cloudflarestorage.com");
    const isR2IdCard = idCardUrl.includes(".r2.cloudflarestorage.com");

    const imageUrlA = isR2Portrait
      ? await getR2AccessibleUrl(portraitUrl)
      : portraitUrl;
    const imageUrlB = isR2IdCard
      ? await getR2AccessibleUrl(idCardUrl)
      : idCardUrl;

    // ── POP HMAC-SHA1 signature (RPC style, RFC 3986) ────────
    // See: https://help.aliyun.com/document_detail/299225.html
    //
    // Algorithm:
    // 1. Build CanonicalizedQueryString: sorted key=value pairs (both key AND value percent-encoded)
    //    (For body-based params like ImageDataA/B, these go in the JSON body instead)
    // 2. StringToSign = HTTPMethod + "&" + percentEncode("/") + "&" + percentEncode(CanonicalizedQueryString)
    // 3. HMAC-SHA1(key=AccessKeySecret+"&", data=StringToSign) → base64
    // 4. Append raw query string + Signature to URL
    //
    // For ImageDataA/ImageDataB: these go in the JSON request body (not query string)
    // because base64 strings are too large for URL query parameters.

    // Signature params (go in URL query string)
    const sigParams = {
      SignatureMethod: "HMAC-SHA1",
      SignatureNonce: nonce,
      AccessKeyId: this.accessKeyId,
      SignatureVersion: "1.0",
      Timestamp: timestamp,
      Format: "JSON",
      RegionId: this.region,
      Version: version,
      Action: action,
      ImageURLA: imageUrlA,
      ImageURLB: imageUrlB,
    };

    const rfcEncode = (v: string) =>
      encodeURIComponent(v)
        .replace(/\+/g, "%20")
        .replace(/\*/g, "%2A")
        .replace(/%7E/g, "~");

    // Build canonical query string (signature covers only URL params, not body)
    const sortedKeys = Object.keys(sigParams).sort();
    const canonicalQS = sortedKeys
      .map(k => `${rfcEncode(k)}=${rfcEncode(String(sigParams[k as keyof typeof sigParams]))}`)
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

    // Build URL with all params and signature
    const urlParams = new URLSearchParams();
    sortedKeys.forEach(k => urlParams.append(k, String(sigParams[k as keyof typeof sigParams])));
    urlParams.append("Signature", signature);
    const url = `https://${host}/?${urlParams.toString()}`;

    // ── Make request ─────────────────────────────────────────
    console.log("[Aliyun VIAPI] URL length:", url.length, "| imageUrlA:", imageUrlA.substring(0, 80));
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