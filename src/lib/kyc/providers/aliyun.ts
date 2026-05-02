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

  /**
   * 调用阿里云 CompareFace API 比对肖像照与身份证照片
   *
   * 接口：POST https://facebody.{region}.aliyuncs.com/?Action=CompareFace
   * 认证：POP HMAC-SHA1（与 face/compare/route.ts 一致）
   *
   * @param portraitUrl  肖像照 URL（R2 公网 URL）
   * @param idCardUrl    身份证照片 URL（R2 公网 URL）
   */
  async submitFaceVerify(
    portraitUrl: string,
    idCardUrl: string
  ): Promise<FaceVerifyResult> {
    // Stub 模式：开发环境返回通过
    if (STUBS.enabled || !this.accessKeyId || !this.accessKeySecret) {
      console.log("[Aliyun] submitFaceVerify: using STUB (enabled=", STUBS.enabled, ")");
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

    // ── POP 签名（RFC 2104 HMAC-SHA1） ─────────────────────────
    // CompareFace 需要两个 ImageURL 参数：ImageURL1=肖像照, ImageURL2=身份证照
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

    // ── 发起请求 ───────────────────────────────────────────────
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
        throw new Error(`Aliyun API error ${res.status}: ${text}`);
      }

      data = await res.json() as Record<string, unknown>;
      console.log("[Aliyun] CompareFace response:", JSON.stringify(data));
    } catch (err) {
      console.error("[Aliyun] CompareFace request failed:", err);
      throw new Error("阿里云人脸核身请求失败，请稍后重试");
    }

    // ── 解析结果 ───────────────────────────────────────────────
    // 响应格式：{ Data: { Similarity: number, Confidence: number } }
    const similarity = (data.Data as Record<string, unknown>)?.Similarity as number
      ?? (data.Similarity as number)
      ?? 0;

    const confidence = (data.Data as Record<string, unknown>)?.Confidence as number
      ?? (data.Confidence as number)
      ?? 0;

    // 阿里云 CompareFace 返回 0-100 的相似度分数
    // ≥80 认为通过（1:1 对照），60-80 需人工复核，<60 不通过
    const verifyResult: "PASS" | "FAIL" | "REVIEW" =
      similarity >= 80 ? "PASS" : similarity >= 60 ? "REVIEW" : "FAIL";

    const livenessResult: "PASS" | "FAIL" = confidence >= 70 ? "PASS" : "FAIL";

    return {
      verifyScore: Math.round(similarity),
      verifyResult,
      similarity: Math.round(similarity) / 100, // 转为 0-1 格式
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
