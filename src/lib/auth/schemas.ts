import { z } from "zod";

export const UserRole = {
  TALENT: "TALENT",  // Actors, models, influencers - unified role for content creation
  AGENCY: "AGENCY",
  LAWYER: "LAWYER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ─── Register ─────────────────────────────────────────────────────────────
const MEDIA_KIT_VISIBILITY = z.enum(["PUBLIC", "VERIFIED_CREATORS", "PRIVATE"]);
type MediaKitVisibility = z.infer<typeof MEDIA_KIT_VISIBILITY>;

export const RegisterSchema = z.object({
  email: z
    .string()
    .min(1, "邮箱不能为空")
    .email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少8位")
    .regex(/[A-Z]/, "密码需包含至少一个大写字母")
    .regex(/[0-9]/, "密码需包含至少一个数字"),
  confirmPassword: z.string().min(1, "请确认密码"),
  name: z.string().min(1, "姓名不能为空").max(50, "姓名最多50字符"),
  role: z.enum(["TALENT", "AGENCY", "LAWYER"], {
    error: "请选择角色",
  }),
  phone: z.string().optional(),
  // Portrait usage preferences
  allowLicensing: z.boolean().default(true),
  allowedScopes: z.array(z.string()).default([]),
  prohibitedContent: z.array(z.string()).default([]),
  // Actor Media Kit
  mediaKitUrl: z.string().url("无效的 URL 格式").optional().or(z.literal("")),
  mediaKitShareConfirmed: z.boolean().default(false),
  mediaKitReviewOnlyAcknowledged: z.boolean().default(false),
  mediaKitVisibility: MEDIA_KIT_VISIBILITY.default("PRIVATE"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次密码不一致",
  path: ["confirmPassword"],
}).refine((data) => {
  // If role is ACTOR and mediaKitUrl is provided, both confirmations must be true
  if (data.role === "ACTOR" && data.mediaKitUrl && data.mediaKitUrl.trim() !== "") {
    return data.mediaKitShareConfirmed === true && data.mediaKitReviewOnlyAcknowledged === true;
  }
  return true;
}, {
  message: "请确认 Media Kit 链接的使用权限",
  path: ["mediaKitShareConfirmed"],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Email Login ─────────────────────────────────────────────────────────────
export const EmailLoginSchema = z.object({
  email: z.string().min(1, "邮箱不能为空").email("请输入有效的邮箱地址"),
  password: z.string().min(1, "密码不能为空"),
});

export type EmailLoginInput = z.infer<typeof EmailLoginSchema>;

// ─── Phone + OTP Login ───────────────────────────────────────────────────────
export const PhoneSchema = z.object({
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "请输入有效的中国大陆手机号"),
});

export const SendOtpSchema = PhoneSchema;

export const VerifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "请输入有效的中国大陆手机号"),
  code: z.string().length(6, "验证码为6位数字").regex(/^\d{6}$/, "验证码为6位数字"),
});

export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

// ─── API Response ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
