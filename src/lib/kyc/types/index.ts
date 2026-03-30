// ============================================================
// KYC 类型定义
// ============================================================

export type KYCLevel = 1 | 2 | 3;

export type KYCProvider = "aliyun" | "tencent" | "onfido" | "jumio" | "internal";

/** KYC 状态 */
export type KYCState = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

/** KYC 日志动作 */
export type KYCAction =
  | "init"
  | "submit"
  | "ocr_result"
  | "face_verify"
  | "approve"
  | "reject"
  | "webhook"
  | "retry"
  | "expire_check";

/** 身份证 OCR 结果 */
export interface IDCardOCRResult {
  name: string;         // 姓名
  gender: string;       // 性别
  ethnicity: string;    // 民族
  birthDate: string;    // 出生日期
  address: string;      // 地址
  idCardNumber: string; // 身份证号
  authority: string;    // 签发机关
  expireDate: string;   // 有效期
  // 置信度
  confidence: {
    name: number;
    idCardNumber: number;
    address: number;
  };
}

/** 人脸核身结果 */
export interface FaceVerifyResult {
  verifyScore: number;   // 0-100 对照分数
  verifyResult: "PASS" | "FAIL" | "REVIEW";
  similarity: number;    // 相似度 0-1
  livenessScore: number; // 活体分数 0-1
  livenessResult: "PASS" | "FAIL";
}

/** KYC 初始化响应 */
export interface KYCInitResponse {
  sessionToken: string;
  redirectUrl: string;
  expireAt: string;
}

/** KYC 提交数据 */
export interface KYCSubmitPayload {
  level: KYCLevel;
  idCardFrontUrl?: string;  // 身份证正面照（S3 URL）
  idCardBackUrl?: string;   // 身份证背面照
  faceImageUrl?: string;   // 人脸照（可选，用于预传）
}

/** KYC 状态响应 */
export interface KYCStatusResponse {
  status: KYCState;
  level: number;
  verifiedAt: string | null;
  expiredAt: string | null;
  provider: string | null;
  celebrityStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
}

/** 艺人申请 payload */
export interface CelebrityApplicationPayload {
  stageName: string;
  realName: string;
  idCardNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  authLetterUrl: string;
  authLetterHash?: string;
  notaryCertUrl?: string;
  agencyName?: string;
  agencyContact?: string;
  agencyPhone?: string;
}

// ============================================================
// 第三方 KYC 提供商接口（统一抽象）
// ============================================================

export interface KYCProviderConfig {
  provider: KYCProvider;
  apiKey: string;
  apiSecret?: string;
  region?: string;
  appId?: string;       // 腾讯云用
  accessKeyId?: string; // 阿里云用
}

export interface KYCProviderClient {
  initSession(userId: string, level: KYCLevel): Promise<{
    sessionToken: string;
    redirectUrl: string;
    externalRef: string;
  }>;

  submitOCR(idCardFrontUrl: string, idCardBackUrl: string): Promise<IDCardOCRResult>;

  submitFaceVerify(faceImageUrl: string, idCardNumber: string): Promise<FaceVerifyResult>;

  queryStatus(externalRef: string): Promise<{
    status: "PENDING" | "APPROVED" | "REJECTED";
    result?: IDCardOCRResult & FaceVerifyResult;
  }>;

  handleWebhook(payload: Record<string, unknown>): Promise<{
    userId: string;
    status: KYCState;
    externalRef: string;
    result?: IDCardOCRResult & FaceVerifyResult;
  }>;
}
