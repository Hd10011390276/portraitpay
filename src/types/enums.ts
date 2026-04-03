// Enum types converted to string aliases for Neon/Supabase compatibility

export type UserRole = string;
export type KYCStatus = string;
export type PortraitStatus = string;
export type AuthorizationStatus = string;
export type TransactionType = string;
export type TransactionStatus = string;
export type ReportStatus = string;
export type InfringementType = string;
export type CelebrityAppStatus = string;
export type LicenseType = string;
export type EnterpriseStatus = string;
export type AlertStatus = string;
export type NoticeStatus = string;
export type NoticeType = string;
export type EntAuthStatus = string;
export type WithdrawalStatus = string;
export type SettlementStatus = string;
export type AuditAction = string;
export type NotificationType = string;
export type UserAuditAction = string;
export type ApiKeyStatus = string;
export type AIContentType = string;
export type IPRegistrationStatus = string;
export type CertificateType = string;
export type ContactType = string;
export type ContactStatus = string;

// String constants for common values
export const USER_ROLES = {
  USER: "USER",
  ARTIST: "ARTIST",
  AGENCY: "AGENCY",
  ENTERPRISE: "ENTERPRISE",
  CELEBRITY: "CELEBRITY",
  ADMIN: "ADMIN",
  VERIFIER: "VERIFIER",
} as const;

export const KYC_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;

export const PORTRAIT_STATUSES = {
  DRAFT: "DRAFT",
  UNDER_REVIEW: "UNDER_REVIEW",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  ARCHIVED: "ARCHIVED",
} as const;

export const AUTHORIZATION_STATUSES = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
  REJECTED: "REJECTED",
} as const;

export const LICENSE_TYPES = {
  EXCLUSIVE: "EXCLUSIVE",
  NON_EXCLUSIVE: "NON_EXCLUSIVE",
  SEMI_EXCLUSIVE: "SEMI_EXCLUSIVE",
  EDITORIAL: "EDITORIAL",
  PERSONAL: "PERSONAL",
} as const;

export const ENT_AUTH_STATUSES = {
  PENDING_PORTRAIT_OWNER: "PENDING_PORTRAIT_OWNER",
  PENDING_PLATFORM_REVIEW: "PENDING_PLATFORM_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REVOKED: "REVOKED",
} as const;

export const USER_AUDIT_ACTIONS = {
  LOGIN: "LOGIN",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  OTP_SENT: "OTP_SENT",
  OTP_VERIFIED: "OTP_VERIFIED",
  OTP_FAILED: "OTP_FAILED",
  PROFILE_UPDATE: "PROFILE_UPDATE",
  PHONE_BIND: "PHONE_BIND",
  PHONE_UNBIND: "PHONE_UNBIND",
  WALLET_BIND: "WALLET_BIND",
  WALLET_UNBIND: "WALLET_UNBIND",
  KYC_SUBMITTED: "KYC_SUBMITTED",
  KYC_APPROVED: "KYC_APPROVED",
  KYC_REJECTED: "KYC_REJECTED",
  KYC_EXPIRED: "KYC_EXPIRED",
  PORTRAIT_REGISTERED: "PORTRAIT_REGISTERED",
  PORTRAIT_UPDATED: "PORTRAIT_UPDATED",
  PORTRAIT_SUSPENDED: "PORTRAIT_SUSPENDED",
  PORTRAIT_DELETED: "PORTRAIT_DELETED",
  AUTH_REQUEST_SENT: "AUTH_REQUEST_SENT",
  AUTH_APPROVED: "AUTH_APPROVED",
  AUTH_REJECTED: "AUTH_REJECTED",
  AUTH_REVOKED: "AUTH_REVOKED",
  AUTH_CERTIFICATE_DOWNLOADED: "AUTH_CERTIFICATE_DOWNLOADED",
  EARNINGS_WITHDRAWN: "EARNINGS_WITHDRAWN",
  EARNINGS_EXPORTED: "EARNINGS_EXPORTED",
  SETTLEMENT_VIEWED: "SETTLEMENT_VIEWED",
  NOTIFICATION_SETTINGS_UPDATED: "NOTIFICATION_SETTINGS_UPDATED",
  MONITOR_CONFIG_UPDATED: "MONITOR_CONFIG_UPDATED",
  API_KEY_CREATED: "API_KEY_CREATED",
  API_KEY_DELETED: "API_KEY_DELETED",
  API_KEY_ROTATED: "API_KEY_ROTATED",
} as const;
