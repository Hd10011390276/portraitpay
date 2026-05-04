/**
 * Aliyun Face Verification integration
 *
 * Documentation: https://help.aliyun.com/zh/face-verification/
 *
 * Usage:
 * 1. Enable Aliyun Face Verification service
 * 2. Get AccessKeyId / AccessKeySecret
 * 3. Replace the STUBS below with real API calls
 */

import type {
  KYCProviderClient,
  IDCardOCRResult,
  FaceVerifyResult,
  KYCLevel,
  KYCState,
} from "../types";

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
  private readonly appId: string;

  constructor(opts: {
    accessKeyId: string;
    accessKeySecret: string;
    region?: string;
    appId: string;
  }) {
    this.accessKeyId = opts.accessKeyId;
    this.accessKeySecret = opts.accessKeySecret;
    this.region = opts.region ?? "cn-shanghai";
    this.appId = opts.appId;
  }

  // ─── 1. Initialize verification session ────────────────────

  async initSession(userId: string, level: KYCLevel): Promise<{
    sessionToken: string;
    redirectUrl: string;
    externalRef: string;
  }> {
    if (isStubEnabled() || !this.accessKeyId || !this.accessKeySecret) {
      const ref = `aliyun_${userId}_${Date.now()}`;
      return {
        sessionToken: ref,
        redirectUrl: this.appId
          ? `https://bizauth.verification.aliyun.com/initialize?appId=${this.appId}&sessionId=${ref}`
          : `https://portraitpayai.com/kyc/callback?provider=aliyun&sessionId=${ref}`,
        externalRef: ref,
      };
    }

    /**
     * Real API call example (REST):
     * POST https://faceverification.{region}.aliyuncs.com/
     * {
     *   "ProductKey": this.appId,
     *   "TicketId": ticketId,
     *   "MetaInfo": Buffer.from(JSON.stringify({ userId, level })).toString("base64"),
     *   "SignedAt": new Date().toISOString(),
     * }
     */
    const ticketId = `TKT_${Date.now()}_${userId}`;
    const redirectUrl = `https://bizauth.verification.aliyun.com/initialize?appId=${this.appId}&ticketId=${ticketId}`;

    return {
      sessionToken: ticketId,
      redirectUrl,
      externalRef: ticketId,
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
   * Call Aliyun CompareFace API to compare portrait with ID card photo
   *
   * API: POST https://facebody.{region}.aliyuncs.com/?Action=CompareFace
   * Auth: POP HMAC-SHA1 (same as face/compare/route.ts)
   *
   * @param portraitUrl  Portrait photo URL (R2 public URL)
   * @param idCardUrl    ID card photo URL (R2 public URL)
   */
  async submitFaceVerify(
    portraitUrl: string,
    idCardUrl: string
  ): Promise<FaceVerifyResult> {
    if (isStubEnabled() || !this.accessKeyId || !this.accessKeySecret) {
      console.log("[Aliyun] submitFaceVerify: using STUB (enabled=", isStubEnabled(), ")");
      return this.stubFaceVerify();
    }

    console.log("[Aliyun] submitFaceVerify: calling real CompareFace API");
    console.log("[Aliyun]   portraitUrl:", portraitUrl);
    console.log("[Aliyun]   idCardUrl:", idCardUrl);

    const region = this.region;
    const host = `facebody.${region}.aliyuncs.com`;
    const action = "CompareFace";
    const version = "2019-12-30";
    const timestamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const nonce = crypto.randomUUID();

    // ── POP signature (RFC 2104 HMAC-SHA1) ───────────────────
    // CompareFace requires two ImageURL params: ImageURL1=portrait, ImageURL2=idCard
    const sortedParams = new URLSearchParams({
      SignatureMethod: "HMAC-SHA1",
      SignatureNonce: nonce,
      AccessKeyId: this.accessKeyId,
      SignatureVersion: "1.0",
      Timestamp: timestamp,
      Format: "JSON",
      RegionId: region,
      Version: version,
      Action: action,
      ImageURL1: portraitUrl,
      ImageURL2: idCardUrl,
    });

    const sortedKeys = Array.from(sortedParams.keys()).sort();
    const queryString = sortedKeys.map(k => `${k}=${sortedParams.get(k)}`).join("&");

    const stringToSign = [
      "POST",
      await this._encode("/"),
      await this._encode(queryString),
    ].join("&");

    const key = this.accessKeySecret + "&";
    const keyBuf = new TextEncoder().encode(key);
    const dataBuf = new TextEncoder().encode(stringToSign);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyBuf, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
    const signature = Buffer.from(sig).toString("base64");
    const encodedSig = await this._encode(signature);

    const url = `https://${host}/?Signature=${encodedSig}&${queryString}`;

    // ── Make request ───────────────────────────────────────────
    let data: Record<string, unknown>;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[Aliyun] CompareFace HTTP error:", res.status, text);
        throw new Error(`Face verification provider error ${res.status}: ${text}`);
      }

      data = await res.json() as Record<string, unknown>;
      console.log("[Aliyun] CompareFace response:", JSON.stringify(data));
    } catch (err) {
      console.error("[Aliyun] CompareFace request failed:", err);
      throw new Error("Face verification request failed, please try again later");
    }

    // ── Parse result ───────────────────────────────────────────
    const similarity = (data.Data as Record<string, unknown>)?.Similarity as number
      ?? (data.Similarity as number)
      ?? 0;

    const confidence = (data.Data as Record<string, unknown>)?.Confidence as number
      ?? (data.Confidence as number)
      ?? 0;

    // Aliyun CompareFace returns similarity score 0-100
    // >=80: pass (1:1 comparison), 60-80: manual review, <60: fail
    const verifyResult: "PASS" | "FAIL" | "REVIEW" =
      similarity >= 80 ? "PASS" : similarity >= 60 ? "REVIEW" : "FAIL";

    const livenessResult: "PASS" | "FAIL" = confidence >= 70 ? "PASS" : "FAIL";

    return {
      verifyScore: Math.round(similarity),
      verifyResult,
      similarity: Math.round(similarity) / 100,
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