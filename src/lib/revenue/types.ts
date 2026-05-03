// Revenue & Payment Type Definitions

export const PLATFORM_FEE_RATE = 0.01; // 1% platform fee
export const OWNER_SPLIT_RATE = 0.99;   // 99% to portrait owner
export const MIN_WITHDRAWAL_AMOUNT = 100; // 楼100 minimum

export const WITHDRAWAL_SETTLEMENT_DAYS = [1, 2, 3]; // 1-3 business days

export type RevenueSplit = {
  gross: number;       // 鎬绘敹鐩婏紙鍚钩鍙拌垂锛?
  platformFee: number;  // 骞冲彴1%
  ownerRevenue: number; // 鑲栧儚鎵€鏈夎€?9%
};

export type EarningsSummary = {
  totalRevenue: number;       // 鍘嗗彶鎬绘敹鐩婏紙鐢ㄦ埛鍑€鏀跺叆锛?
  monthRevenue: number;      // 鏈湀鏀剁泭
  pendingRevenue: number;    // 寰呯粨绠?
  availableBalance: number; // 鍙彁鐜颁綑棰?
  totalWithdrawals: number;  // 宸叉彁鐜版€婚
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
