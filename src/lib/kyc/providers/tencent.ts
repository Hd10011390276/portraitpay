/**
 * 腾讯云人脸核身（FaceID）集成
 *
 * 文档参考：https://cloud.tencent.com/document/product/1007
 *
 * 使用方式：
 * 1. 开通腾讯云人脸核身服务
 * 2. 获取 SecretId / SecretKey / AppId
 * 3. 替换下方 STUBS 中的桩代码为真实 API 调用
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
 * 腾讯云人脸核身客户端
 *
 * 真实实现需要：
 * 1. npm install tencentcloud-sdk-nodejs（已内置）
 * 2. 使用 FaceidClient / IntlElectricVerificationApi
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

  // ─── 1. 初始化认证会话 ───────────────────────────────────────

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
     * 真实调用：腾讯云获取身份验证 Token
     * POST https://faceid.faceid.tencentcloudapi.com/
     * Action: GetFaceIdToken
     * {
     *   "SessionToken": sessionToken, // 用户端 SDK 拿到
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

  // ─── 2. 身份证 OCR ──────────────────────────────────────────

  async submitOCR(
    idCardFrontUrl: string,
    idCardBackUrl: string
  ): Promise<IDCardOCRResult> {
    if (STUBS.enabled) {
      return {
        name: "张三",
        gender: "男",
        ethnicity: "汉",
        birthDate: "1990-01-01",
        address: "北京市朝阳区某某街道某某小区1号楼101室",
        idCardNumber: "110101199001011234",
        authority: "北京市公安局朝阳分局",
        expireDate: "2030-01-01",
        confidence: { name: 99.8, idCardNumber: 99.9, address: 98.5 },
      };
    }

    /**
     * 真实调用：腾讯云身份证 OCR
     * POST https://ocr.api.qcloud.com/
     * Action: IDCardOCR
     * { "ImageUrl": idCardFrontUrl, "CardType": 0 }
     */
    throw new Error("Tencent OCR not implemented — set KYC_TENCENT_STUB=true for dev");
  }

  // ─── 3. 人脸对照 ─────────────────────────────────────────────

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
     * 真实调用：腾讯云人脸对照
     * POST https://faceid.faceid.tencentcloudapi.com/
     * Action: CompareFace
     * { "ImageUrlA": faceImageUrl, "ImageUrlB": idCardNumber } // 或使用 faceid token
     */
    throw new Error("Tencent FaceVerify not implemented — set KYC_TENCENT_STUB=true for dev");
  }

  // ─── 4. 查询状态 ────────────────────────────────────────────

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
     * 真实调用：POST https://faceid.faceid.tencentcloudapi.com/
     * Action: GetFaceIdResult
     * { "SessionToken": externalRef }
     */
    throw new Error("Tencent queryStatus not implemented — set KYC_TENCENT_STUB=true for dev");
  }

  // ─── 5. 处理回调 ────────────────────────────────────────────

  async handleWebhook(payload: Record<string, unknown>): Promise<{
    userId: string;
    status: KYCState;
    externalRef: string;
  }> {
    const status = payload["result"] as string;
    const userId = payload["userId"] as string ?? "unknown";
    const externalRef = payload["session_id"] as string ?? "";

    const stateMap: Record<string, KYCState> = {
      "0": "APPROVED",   // 通过
      "-1": "REJECTED",  // 不通过
      "-2": "PENDING",   // 疑似
    };

    return {
      userId,
      status: stateMap[status] ?? "PENDING",
      externalRef,
    };
  }
}
