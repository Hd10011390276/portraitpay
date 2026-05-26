import { z } from "zod";

export const UserRole = {
  TALENT: "TALENT",  // Actors, models, influencers - unified role for content creation
  AGENT: "AGENT",    // IP holders managing multiple people's portraits
  AGENCY: "AGENCY",
  LAWYER: "LAWYER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ─── Register ─────────────────────────────────────────────────────────────
const MEDIA_KIT_VISIBILITY = z.enum(["PUBLIC", "VERIFIED_CREATORS", "PRIVATE"]);
type MediaKitVisibility = z.infer<typeof MEDIA_KIT_VISIBILITY>;

export const RegisterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  role: z.enum(["TALENT", "AGENT", "AGENCY", "LAWYER"], {
    error: "Please select a role",
  }),
  phone: z.string().optional(),
  // Portrait usage preferences
  allowLicensing: z.boolean().default(true),
  allowedScopes: z.array(z.string()).default([]),
  prohibitedContent: z.array(z.string()).default([]),
  // Actor Media Kit
  mediaKitUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
  mediaKitShareConfirmed: z.boolean().default(false),
  mediaKitReviewOnlyAcknowledged: z.boolean().default(false),
  mediaKitVisibility: MEDIA_KIT_VISIBILITY.default("PRIVATE"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "TALENT" && data.mediaKitUrl && data.mediaKitUrl.trim() !== "") {
    return data.mediaKitShareConfirmed === true && data.mediaKitReviewOnlyAcknowledged === true;
  }
  return true;
}, {
  message: "Please confirm Media Kit URL usage rights",
  path: ["mediaKitShareConfirmed"],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Email Login ─────────────────────────────────────────────────────────────
export const EmailLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  loginAs: z.enum(["user", "lawyer", "agency"]).optional(),
});

export type EmailLoginInput = z.infer<typeof EmailLoginSchema>;

// ─── Phone + OTP Login ───────────────────────────────────────────────────────
export const PhoneSchema = z.object({
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "Invalid Chinese mobile number"),
});

export const SendOtpSchema = PhoneSchema;

export const VerifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "Invalid Chinese mobile number"),
  code: z.string().length(6, "Verification code must be 6 digits").regex(/^\d{6}$/, "Verification code must be 6 digits"),
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
