// Test OTP utility — generates and stores OTPs in memory.
// In production, swap for Twilio / Alibaba Cloud SMS.

const otpStore = new Map<
  string,
  { code: string; expires: Date; attempts: number }
>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create (or recreate) an OTP for a phone number.
 */
export function createOtp(phone: string): { code: string; expiresAt: Date } {
  const code = generateCode();
  const expires = new Date(Date.now() + OTP_TTL_MS);
  otpStore.set(phone, { code, expires, attempts: 0 });

  // In dev/test mode we return the code so it can be shown to the user.
  // In production this step would send an SMS and NOT return the code.
  return { code, expiresAt: expires };
}

/**
 * Verify an OTP. Returns true if valid, false otherwise.
 * Increments attempt counter; clears after max attempts.
 */
export function verifyOtp(phone: string, code: string): boolean {
  const entry = otpStore.get(phone);

  if (!entry) return false;
  if (new Date() > entry.expires) {
    otpStore.delete(phone);
    return false;
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phone);
    return false;
  }

  entry.attempts += 1;

  if (entry.code !== code) {
    return false;
  }

  otpStore.delete(phone); // one-time use
  return true;
}
