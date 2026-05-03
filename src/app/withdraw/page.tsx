/**
 * /withdraw — Withdrawal Application Page
 * Supports region-based payment methods:
 * - US: PayPal, Credit Card (Stripe), Bank Transfer
 * - HK/TW/OTHER: PayPal, Bank Transfer
 */

"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

interface EarningsSummary {
  availableBalance: number;
  currency: string;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  bankName: string | null;
  bankAccountLast4: string | null;
  accountHolder: string | null;
  rejectionReason: string | null;
  createdAt: string;
  completedAt: string | null;
  paymentMethod?: string;
  region?: string;
}

interface StripeAccountStatus {
  hasStripeAccount: boolean;
  stripeAccountId: string | null;
  accountStatus: string | null;
  payoutsEnabled: boolean;
  bankAccountConnected: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50",
  PROCESSING: "text-blue-600 bg-blue-50",
  APPROVED: "text-green-600 bg-green-50",
  REJECTED: "text-red-600 bg-red-50",
  COMPLETED: "text-gray-600 bg-gray-50",
  FAILED: "text-red-600 bg-red-50",
};


const MIN_WITHDRAWAL_USD = 10;

type PaymentMethod = "paypal" | "credit_card" | "bank";
type Region = "US" | "HK" | "TW" | "OTHER";

const REGION_OPTIONS: { value: Region; flag: string }[] = [
  { value: "US", flag: "🇺🇸" },
  { value: "HK", flag: "🇭🇰" },
  { value: "TW", flag: "🇹🇼" },
  { value: "OTHER", flag: "🌍" },
];

function getPaymentMethodsForRegion(region: Region, t: Record<string, any>) {
  switch (region) {
    case "US":
      return [
        { value: "paypal" as PaymentMethod, label: t.withdraw.paypal, icon: "🟣" },
        { value: "credit_card" as PaymentMethod, label: t.withdraw.creditCard, icon: "💳" },
        { value: "bank" as PaymentMethod, label: t.withdraw.bankTransfer, icon: "🏦" },
      ];
    case "HK":
    case "TW":
    case "OTHER":
    default:
      return [
        { value: "paypal" as PaymentMethod, label: t.withdraw.paypal, icon: "🟣" },
        { value: "bank" as PaymentMethod, label: t.withdraw.bankTransfer, icon: "🏦" },
      ];
  }
}

function WithdrawPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<EarningsSummary | null>(null);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [stripeAccount, setStripeAccount] = useState<StripeAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [settingUpStripe, setSettingUpStripe] = useState(false);
  const { t, locale } = useLanguage();

  // Form state
  const [region, setRegion] = useState<Region>("US");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paypal");
  const [accountId, setAccountId] = useState(""); // PayPal email / Account ID
  const [accountName, setAccountName] = useState(""); // Account holder name
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const currency = "USD";
  const minAmount = MIN_WITHDRAWAL_USD;
  const currencySymbol = "$";

  const paymentMethods = getPaymentMethodsForRegion(region, t);

  // Update payment method when region changes
  useEffect(() => {
    const methods = getPaymentMethodsForRegion(region, t);
    if (!methods.find(m => m.value === paymentMethod)) {
      setPaymentMethod(methods[0].value);
    }
  }, [region, t, paymentMethod]);

  const loadData = useCallback(async () => {
    const [balanceRes, historyRes, stripeRes] = await Promise.all([
      fetch("/api/v1/earnings/summary"),
      fetch("/api/v1/withdrawals"),
      fetch("/api/v1/withdrawals/stripe-account"),
    ]);
    if (balanceRes.ok) {
      const d = await balanceRes.json();
      setBalance(d.data);
    }
    if (historyRes.ok) {
      const d = await historyRes.json();
      setHistory(d.data ?? []);
    }
    if (stripeRes.ok) {
      const d = await stripeRes.json();
      setStripeAccount(d.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchParams.get("stripe_refresh") === "true") {
      loadData();
    }
  }, [searchParams, loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  const validateForm = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < minAmount) {
      return t.withdraw.minAmount.replace("{min}", `${currencySymbol}${minAmount}`);
    }
    if (balance && Number(amount) > balance.availableBalance) {
      return t.withdraw.balanceInsufficient.replace("{balance}", balance.availableBalance.toFixed(2));
    }
    if (!accountId.trim()) return t.withdraw.pleaseFillAccountId;
    if (!accountName.trim()) return t.withdraw.pleaseFillAccountName;
    if (paymentMethod === "bank") {
      if (!bankName.trim()) return t.withdraw.pleaseFillBankName;
      if (!bankAccount.trim() || bankAccount.length < 8) return t.withdraw.pleaseFillBankAccount;
    }
    return null;
  };

  const handleSetupStripe = async () => {
    setSettingUpStripe(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/withdrawals/stripe-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.withdraw.submitFailed);
        return;
      }
      window.location.href = data.data.onboardingUrl;
    } catch {
      setError(t.withdraw.networkError);
    } finally {
      setSettingUpStripe(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          currency,
          region,
          paymentMethod,
          accountId,
          accountName,
          ...(paymentMethod === "bank" && {
            bankName,
            bankAccount,
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.withdraw.submitFailed);
        return;
      }

      setSuccessMsg(t.withdraw.withdrawSuccess);
      setAmount("");
      setAccountId("");
      setAccountName("");
      setBankName("");
      setBankAccount("");
      loadData();
    } catch {
      setError(t.withdraw.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "zh-CN" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const getMethodIcon = (pm: string) => {
    switch (pm) {
      case "paypal": return "🟣";
      case "credit_card": return "💳";
      case "bank": return "🏦";
      default: return "💰";
    }
  };

  const getMethodLabel = (pm: string) => {
    switch (pm) {
      case "paypal": return t.withdraw.paypal;
      case "credit_card": return t.withdraw.creditCard;
      case "bank": return t.withdraw.bankTransfer;
      default: return pm;
    }
  };

  return (
    <DashboardShell
      title={t.withdraw.title}
      subtitle={t.withdraw.subtitle}
    >
      <div className="max-w-3xl space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <p className="text-blue-100 text-sm mb-1">{t.withdraw.availableBalance}</p>
          <p className="text-3xl sm:text-4xl font-bold">
            {loading ? "—" : formatCurrency(balance?.availableBalance ?? 0)}
          </p>
          <p className="text-blue-200 text-xs mt-2">{t.withdraw.balanceNote}</p>
        </div>

        {/* Stripe Account Status Banner (US region only) */}
        {!loading && region === "US" && (
          <div className={`rounded-xl p-4 border ${
            stripeAccount?.hasStripeAccount
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stripeAccount?.hasStripeAccount ? "bg-green-100" : "bg-yellow-100"}`}>
                  {stripeAccount?.hasStripeAccount ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${stripeAccount?.hasStripeAccount ? "text-green-800 dark:text-green-300" : "text-yellow-800 dark:text-yellow-300"}`}>
                    {stripeAccount?.hasStripeAccount ? t.withdraw.stripeReady : t.withdraw.stripeNotReady}
                  </p>
                  <p className={`text-xs ${stripeAccount?.hasStripeAccount ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                    {stripeAccount?.hasStripeAccount ? t.withdraw.stripeReadyDesc : t.withdraw.stripeSetupRequired}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Form */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-5">{t.withdraw.fillWithdrawInfo}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">{error}</div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">{successMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Region Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.withdraw.selectRegion}</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {REGION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRegion(opt.value)}
                    className={`p-2 rounded-xl border-2 transition-all text-center ${
                      region === opt.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                  >
                    <span className="text-lg">{opt.flag}</span>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5 leading-tight">
                      {opt.value === "US" ? t.withdraw.regionUS : opt.value === "HK" ? t.withdraw.regionHK : opt.value === "TW" ? t.withdraw.regionTW : t.withdraw.regionOther}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.withdraw.amount.replace("¥", currencySymbol).replace("$", currencySymbol)}
              </label>
              <input
                type="number"
                min={minAmount}
                step="0.01"
                placeholder={`${currencySymbol}${minAmount}`}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {!loading && balance && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t.withdraw.currentAvailable.replace("{balance}", formatCurrency(balance.availableBalance)).replace("{balanceFixed}", balance.availableBalance.toFixed(2))}
                </p>
              )}

            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.withdraw.paymentMethod}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === method.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                  >
                    <span className="text-xl mr-2">{method.icon}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>



            {/* Account ID (PayPal / Credit Card) */}
            {paymentMethod !== "bank" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {paymentMethod === "paypal" ? t.withdraw.paypalAccount : t.withdraw.creditCardAccount}
                </label>
                <input
                  type="text"
                  placeholder={paymentMethod === "paypal" ? t.withdraw.paypalPlaceholder : t.withdraw.creditCardPlaceholder}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                />
              </div>
            )}

            {/* Account Name */}
            {paymentMethod !== "bank" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.withdraw.accountHolderName}</label>
                <input
                  type="text"
                  placeholder={t.withdraw.accountHolderNamePlaceholder}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
            )}

            {/* Bank Transfer Fields */}
            {paymentMethod === "bank" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.withdraw.bankName}</label>
                  <input
                    type="text"
                    placeholder={t.withdraw.bankNamePlaceholder}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.withdraw.bankAccount}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={t.withdraw.bankAccountPlaceholder}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.withdraw.accountHolder}</label>
                  <input
                    type="text"
                    placeholder={t.withdraw.accountHolderPlaceholder}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>• {t.withdraw.withdrawNote1.replace("{min}", minAmount.toString()).replace("¥", currencySymbol).replace("$", currencySymbol)}</p>
              <p>• {t.withdraw.withdrawNote2}</p>
              <p>• {t.withdraw.withdrawNote3}</p>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t.withdraw.submitting : t.withdraw.confirmWithdraw}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white">{t.withdraw.withdrawHistory}</h2>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">{t.withdraw.noHistory}</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {history.map((w) => {
                const statusColor = STATUS_COLOR[w.status] ?? "text-gray-600 bg-gray-50";
                const statusText = w.status === "PENDING" ? t.withdraw.statusPending : w.status === "PROCESSING" ? t.withdraw.statusProcessing : w.status === "APPROVED" ? t.withdraw.statusApproved : w.status === "REJECTED" ? t.withdraw.statusRejected : w.status === "COMPLETED" ? t.withdraw.statusCompleted : w.status === "FAILED" ? t.withdraw.statusFailed : w.status;
                return (
                  <div key={w.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(w.amount)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {getMethodIcon(w.paymentMethod ?? "bank")} {getMethodLabel(w.paymentMethod ?? "bank")}
                        {w.bankAccountLast4 ? ` ****${w.bankAccountLast4}` : ""} · {formatDate(w.createdAt)}
                      </p>
                      {w.rejectionReason && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{t.withdraw.rejectionReason.replace("{reason}", w.rejectionReason)}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function LoadingFallback() {
  return (
    <DashboardShell title="提现" subtitle="PortraitPay AI · 收益提现申请">
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    </DashboardShell>
  );
}

export default function WithdrawPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WithdrawPageContent />
    </Suspense>
  );
}
