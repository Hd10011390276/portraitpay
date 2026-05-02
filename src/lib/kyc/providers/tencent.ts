/**
 * Tencent Cloud FaceID integration
 *
 * Documentation: https://cloud.tencent.com/document/product/1007
 *
 * Usage:
 * 1. Enable Tencent Cloud FaceID service
 * 2. Get SecretId / SecretKey / AppId
 * 3. Replace the STUBS below with real API calls
 */

import type {
  KYCProviderClient,
  IDCardOCRResult,
  FaceVerifyResult,
  KYCLevel,
  KYCState,
} from "../types";

const STUBS = {
  enabled: process.env.KYC_TENCENT_STUB === "true",
  autoApprove: process.env.KYC_TENCENT_AUTO_APPROVE === "true",
};

/**
 * Tencent Cloud FaceID client
 *
 * Real implementation requires:
 * 1. npm install tencentcloud-sdk-nodejs (built-in)
 * 2. Use FaceidClient / IntlElectricVerificationApi
 */
export class TencentKYCProvider implements KYCProviderClient {
  private readonly secretId: string;
  private readonly secretKey: string;
  private readonly appId: string;
  private readonly region: string;

  constructor(opts: {
    secretId: string;
    secretKey: string;
    appId: string;
    region?: string;
  }) {
    this.secretId = opts.secretId;
    this.secretKey = opts.secretKey;
    this.appId = opts.appId;
    this.region = opts.region ?? "ap-guangzhou";
  }

  // ─── 1. Initialize verification session ────────────────────

  async initSession(userId: string, level: KYCLevel): Promise<{
    sessionToken: string;
    redirectUrl: string;
    externalRef: string;
  }> {
    if (STUBS.enabled) {
      const ref = `tencent_${userId}_${Date.now()}`;
      return {
        sessionToken: ref,
        redirectUrl: `https://miniprogram.myqcloud.com/faceid/login?appId=${this.appId}&sessionId=${ref}`,
        externalRef: ref,
      };
    }

    /**
     * Real API call: Tencent Cloud GetFaceIdToken
     * POST https://faceid.faceid.tencentcloudapi.com/
     * Action: GetFaceIdToken
     * {
     *   "SessionToken": sessionToken, // from client SDK
     *   "Level": level === 3 ? "LEVEL_3" : "LEVEL_2",
     * }
     */
    const ref = `tct_${Date.now()}_${userId}`;
    return {
      sessionToken: ref,
      redirectUrl: `https://miniprogram.myqcloud.com/faceid/login?appId=${this.appId}&sessionId=${ref}`,
      externalRef: ref,
    };
  }

  // ─── 2. ID Card OCR ─────────────────────────────────────────

  async submitOCR(
    idCardFrontUrl: string,
    idCardBackUrl: string
  ): Promise<IDCardOCRResult> {
    if (STUBS.enabled) {
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

    /**
     * Real call: Tencent Cloud ID Card OCR
     * POST https://ocr.api.qcloud.com/
     * Action: IDCardOCR
     * { "ImageUrl": idCardFrontUrl, "CardType": 0 }
     */
    throw new Error("Tencent OCR not implemented — set KYC_TENCENT_STUB=true for dev");
  }

  // ─── 3. Face comparison ─────────────────────────────────────

  async submitFaceVerify(
    faceImageUrl: string,
    idCardNumber: string
  ): Promise<FaceVerifyResult> {
    if (STUBS.enabled) {
      return {
        verifyScore: 97.8,
        verifyResult: "PASS",
        similarity: 0.978,
        livenessScore: 0.96,
        livenessResult: "PASS",
      };
    }

    /**
     * Real call: Tencent Cloud face comparison
     * POST https://faceid.faceid.tencentcloudapi.com/
     * Action: CompareFace
     * { "ImageUrlA": faceImageUrl, "ImageUrlB": idCardNumber } // or use faceid token
     */
    throw new Error("Tencent FaceVerify not implemented — set KYC_TENCENT_STUB=true for dev");
  }

  // ─── 4. Query status ────────────────────────────────────────

  async queryStatus(externalRef: string): Promise<{
    status: "PENDING" | "APPROVED" | "REJECTED";
    result?: IDCardOCRResult & FaceVerifyResult;
  }> {
    if (STUBS.enabled) {
      return STUBS.autoApprove
        ? { status: "APPROVED" }
        : { status: "PENDING" };
    }

    /**
     * Real call: POST https://faceid.faceid.tencentcloudapi.com/
     * Action: GetFaceIdResult
     * { "SessionToken": externalRef }
     */
    throw new Error("Tencent queryStatus not implemented — set KYC_TENCENT_STUB=true for dev");
  }

  // ─── 5. Handle webhook ──────────────────────────────────────

  async handleWebhook(payload: Record<string, unknown>): Promise<{
    userId: string;
    status: KYCState;
    externalRef: string;
  }> {
    const status = payload["result"] as string;
    const userId = payload["userId"] as string ?? "unknown";
    const externalRef = payload["session_id"] as string ?? "";

    const stateMap: Record<string, KYCState> = {
      "0": "APPROVED",
      "-1": "REJECTED",
      "-2": "PENDING",
    };

    return {
      userId,
      status: stateMap[status] ?? "PENDING",
      externalRef,
    };
  }
}