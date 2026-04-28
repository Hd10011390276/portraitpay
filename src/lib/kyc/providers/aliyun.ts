/**
 * 阿里云实人认证（Face Verification）集成
 *
 * 文档参考：https://help.aliyun.com/zh/face-verification/
 *
 * 使用方式：
 * 1. 开通阿里云实人认证服务
 * 2. 获取 AccessKeyId / AccessKeySecret
 * 3. 替换下方 STUBS 中的桩代码为真实 API 调用
 */

import type {
  KYCProviderClient,
  IDCardOCRResult,
  FaceVerifyResult,
  KYCLevel,
  KYCState,
} from "../types";
import { addMonths } from "date-fns";

// ============================================================
// 桩实现（开发/演示用）- 替换为真实阿里云 SDK 调用
// ============================================================

// STUBS: 开发/演示模式 - 设为 false 以启用真实阿里云 API
// 生产环境必须设为 false（配合真实 KYC_ALIYUN_ACCESS_KEY_ID/SECRET）
// 开发时设为 true 或设置环境变量 KYC_ALIYUN_STUB=true
const STUBS = {
  enabled: false,
  autoApprove: true,
};

/**
 * 阿里云实人认证客户端
 *
 * 真实实现需要：
 * 1. npm install @ AlibabaCloud/face-verification-sdk（或 REST API 调用）
 * 2. 使用阿里云 SDK 的 VerifyToken / CompareFace / RecognizeIdentityCard
 */
export class AliyunKYCProvider implements KYCProviderClient {
  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;
  private readonly region: string;
  private readonly appId: string; // 实人认证方案 ID

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

  // ─── 1. 初始化认证会话 ───────────────────────────────────────

  async initSession(userId: string, level: KYCLevel): Promise<{
    sessionToken: string;
    redirectUrl: string;
    externalRef: string;
  }> {
    if (STUBS.enabled || !this.accessKeyId || !this.accessKeySecret) {
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
     * 真实调用示例（REST）：
     * POST https://faceverification.{region}.aliyuncs.com/
     * {
     *   "ProductKey": this.appId,
     *   "TicketId": ticketId,
     *   "Model": level === 3 ? "FRN" : "LITE",  // 增强认证用 FRN
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

  // ─── 2. 身份证 OCR 识别 ───────────────────────────────────────

  async submitOCR(
    idCardFrontUrl: string,
    idCardBackUrl: string
  ): Promise<IDCardOCRResult> {
    console.log("[KYC STUB] submitOCR called, STUBS.enabled =", STUBS.enabled, "idCardFrontUrl:", idCardFrontUrl);
    if (STUBS.enabled || !this.accessKeyId || !this.accessKeySecret) {
      return this.stubOCR();
    }

    /**
     * 真实调用：阿里云 OCR 身份证识别
     * POST https://ocr.{region}.aliyuncs.com/api/recognize/idcard
     * 或使用：@ AlibabaCloud/ocr-api
     */
    throw new Error("Aliyun OCR not implemented — set KYC_ALIYUN_STUB=true for dev");
  }

  // ─── 3. 人脸核身（1:1 对比） ─────────────────────────────────

  async submitFaceVerify(
    faceImageUrl: string,
    idCardNumber: string
  ): Promise<FaceVerifyResult> {
    if (STUBS.enabled || !this.accessKeyId || !this.accessKeySecret) {
      // ⚠️  STUB MODE: This returns fake pass data. MUST BE DISABLED IN PRODUCTION.
      //  Set STUBS.enabled = false (or remove / set KYC_ALIYUN_STUB=false env var)
      //  before deploying to production so real Aliyun API is called.
      return this.stubFaceVerify();
    }

    /**
     * 真实调用：阿里云人脸核身
     * POST https://faceverification.{region}.aliyuncs.com/
     * {
     *   "VerificationToken": verificationToken,
     *   "VerifyType": "FACECOMPARE",  // 或 "LIVENESSSCORE"
     *   "CompareImageUrl": faceImageUrl,
     *   "IdentityCardNumber": idCardNumber,
     * }
     */
    throw new Error("Aliyun FaceVerify not implemented — set KYC_ALIYUN_STUB=true for dev");
  }

  // ─── 4. 查询状态 ────────────────────────────────────────────

  async queryStatus(externalRef: string): Promise<{
    status: "PENDING" | "APPROVED" | "REJECTED";
    result?: IDCardOCRResult & FaceVerifyResult;
  }> {
    if (STUBS.enabled || !this.accessKeyId || !this.accessKeySecret) {
      return STUBS.autoApprove
        ? { status: "APPROVED", result: { ...this.stubOCR(), ...this.stubFaceVerify() } }
        : { status: "PENDING" };
    }

    /**
     * 真实调用：POST https://faceverification.{region}.aliyuncs.com/
     * { "TicketId": externalRef, "ProductKey": this.appId }
     */
    throw new Error("Aliyun queryStatus not implemented — set KYC_ALIYUN_STUB=true for dev");
  }

  // ─── 5. 处理回调 ────────────────────────────────────────────

  async handleWebhook(payload: Record<string, unknown>): Promise<{
    userId: string;
    status: KYCState;
    externalRef: string;
    result?: IDCardOCRResult & FaceVerifyResult;
  }> {
    // 阿里云回调格式示例
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

  // ─── 桩方法 ─────────────────────────────────────────────────

  private stubOCR(): IDCardOCRResult {
    console.log("[KYC STUB] stubOCR called, STUBS.enabled =", STUBS.enabled);
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
