import { z } from "zod";

export const UserRole = {
  USER: "USER",
  ARTIST: "ARTIST",
  AGENCY: "AGENCY",
  ENTERPRISE: "ENTERPRISE",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ─── Register ─────────────────────────────────────────────────────────────
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
  role: z.enum(["USER", "ARTIST", "AGENCY", "ENTERPRISE"], {
    error: "请选择角色",
  }),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次密码不一致",
  path: ["confirmPassword"],
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
