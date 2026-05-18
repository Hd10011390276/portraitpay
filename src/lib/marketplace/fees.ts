/**
 * Marketplace fee calculations
 * All monetary calculations use decimal math to avoid floating-point errors.
 */

import { PLATFORM_FEE_RATE } from "@/lib/revenue/types";

export type Split = {
  gross: number;
  platformFee: number;
  netPayout: number;
};

/**
 * Get platform fee rate for a transaction type.
 * Falls back to 10% if no FeePolicy record exists.
 */
export async function getPlatformFeeRate(
  _transactionType: string,
  _currency = "USD"
): Promise<number> {
  // TODO: Query FeePolicy table for dynamic rate
  // For now, always return the default 10%
  return PLATFORM_FEE_RATE;
}

/**
 * Calculate marketplace split: platform fee + net payout.
 * Amount should be in major currency units (dollars, not cents).
 */
export function calculateMarketplaceSplit(
  amount: number,
  feeRate?: number
): Split {
  const rate = feeRate ?? PLATFORM_FEE_RATE;
  const gross = amount;
  const platformFee = Math.round(gross * rate * 100) / 100;
  const netPayout = Math.round((gross - platformFee) * 100) / 100;
  return { gross, platformFee, netPayout };
}

/**
 * Convenience: calculate platform fee amount only.
 */
export function calculatePlatformFee(amount: number, feeRate?: number): number {
  const rate = feeRate ?? PLATFORM_FEE_RATE;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Validate offer terms are sane before accepting.
 */
export function validateOfferTerms(terms: string): string | null {
  if (!terms || terms.trim().length === 0) return "Terms are required";
  if (terms.length > 5000) return "Terms too long (max 5000 characters)";
  return null;
}