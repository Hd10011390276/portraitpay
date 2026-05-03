// Revenue & Payment Type Definitions

export const PLATFORM_FEE_RATE = 0.01; // 1% platform fee
export const OWNER_SPLIT_RATE = 0.99;   // 99% to portrait owner
export const MIN_WITHDRAWAL_AMOUNT = 100; // ¥100 minimum

export const WITHDRAWAL_SETTLEMENT_DAYS = [1, 2, 3]; // 1-3 business days

export type RevenueSplit = {
  gross: number;       // 总收益（含平台费）
  platformFee: number;  // 平台1%
  ownerRevenue: number; // 肖像所有者99%
};

export type EarningsSummary = {
  totalRevenue: number;       // 历史总收益（用户净收入）
  monthRevenue: number;      // 本月收益
  pendingRevenue: number;    // 待结算
  availableBalance: number; // 可提现余额
  totalWithdrawals: number;  // 已提现总额
  currency: string;
};

export type TransactionWithPortrait = {
  id: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  createdAt: Date;
  authorizationId: string | null;
  portrait?: {
    id: string;
    title: string;
    ownerId: string;
  } | null;
  metadata?: Record<string, unknown>;
};

export type WithdrawalRequest = {
  amount: number;
  currency: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
};

export type SettlementBreakdown = {
  portraitId: string;
  portraitTitle: string;
  transactionCount: number;
  grossRevenue: number;
  platformFee: number;
  netRevenue: number;
};
