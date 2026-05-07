/**
 * /admin/earnings — Admin Revenue Management Dashboard
 * View all transactions, withdrawals, and platform analytics
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  user: { id: string; displayName: string | null; email: string };
  authorization: {
    id: string;
    portrait: { id: string; title: string; ownerId: string } | null;
    grantee: { id: string; displayName: string | null } | null;
  } | null;
  stripePaymentIntentId: string | null;
}

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  actualAmount: number | null;
  bankName: string | null;
  bankAccountLast4: string | null;
  accountHolder: string | null;
  status: string;
  rejectionReason: string | null;
  stripeTransferId: string | null;
  stripePayoutId: string | null;
  user: { id: string; displayName: string | null; email: string; kycStatus: string };
  createdAt: string;
  processedAt: string | null;
  completedAt: string | null;
}

interface Stats {
  pendingCount: number;
  totalPendingAmount: number;
  totalWithdrawnAmount: number;
}

const TX_TYPE: Record<string, string> = {
  LICENSE_PURCHASE: "License Purchase",
  LICENSE_RENEWAL: "Renewal",
  ROYALTY_PAYOUT: "Royalty Payout",
  PLATFORM_COMMISSION: "Platform Commission",
  WITHDRAWAL: "Withdrawal",
  SETTLEMENT: "Settlement",
};

const TX_STATUS: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Pending", color: "text-yellow-600 bg-yellow-50" },
  COMPLETED: { text: "Completed", color: "text-green-600 bg-green-50" },
  FAILED: { text: "Failed", color: "text-red-600 bg-red-50" },
  REFUNDED: { text: "Refunded", color: "text-orange-600 bg-orange-50" },
  DISPUTED: { text: "Disputed", color: "text-purple-600 bg-purple-50" },
};

const WD_STATUS: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Pending Review", color: "text-yellow-600 bg-yellow-50" },
  PROCESSING: { text: "Processing", color: "text-blue-600 bg-blue-50" },
  APPROVED: { text: "Approved", color: "text-green-600 bg-green-50" },
  REJECTED: { text: "Rejected", color: "text-red-600 bg-red-50" },
  COMPLETED: { text: "Completed", color: "text-gray-600 bg-gray-50" },
  FAILED: { text: "Failed", color: "text-red-600 bg-red-50" },
};

export default function AdminEarningsPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();

  const tc = t.adminEarnings || {} as Record<string, string>;

  const [tab, setTab] = useState<"transactions" | "withdrawals">("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [txMeta, setTxMeta] = useState<{ page: number; totalPages: number; total: number } | null>(null);
  const [wdMeta, setWdMeta] = useState<{ page: number; totalPages: number; total: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const loadTransactions = useCallback(async (page = 1) => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("type", filterType);
    const res = await fetch(`/api/v1/admin/transactions?${params}`);
    if (!res.ok) return;
    const d = await res.json();
    setTransactions(d.data ?? []);
    setTxMeta(d.meta ?? null);
  }, [filterStatus, filterType]);

  const loadWithdrawals = useCallback(async (page = 1) => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/v1/admin/withdrawals?${params}`);
    if (!res.ok) return;
    const d = await res.json();
    setWithdrawals(d.data ?? []);
    setWdMeta(d.meta ?? null);
    setStats(d.stats ?? null);
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    if (tab === "transactions") {
      loadTransactions().finally(() => setLoading(false));
    } else {
      loadWithdrawals().finally(() => setLoading(false));
    }
  }, [tab, loadTransactions, loadWithdrawals]);

  const handleWithdrawalAction = async (id: string, action: "approve" | "reject", reason?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/v1/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) loadWithdrawals();
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (v: number, c = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(v);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "zh-CN" || locale === "zh-Hant" ? "zh-CN" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-700">←</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tc.pageTitle}
            </h1>
            <p className="text-sm text-gray-500">
              {tc.pageSubtitle}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">
                {tc.pendingWithdrawals}
              </p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount} {tc.items}</p>
              <p className="text-sm text-gray-600">{formatCurrency(stats.totalPendingAmount)}</p>
            </div>
            <div className="bg-white rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">
                {tc.totalWithdrawn}
              </p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalWithdrawnAmount)}</p>
            </div>
            <div className="bg-white rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">
                {tc.platformRevenue}
              </p>
              <p className="text-2xl font-bold text-blue-600">—</p>
              <p className="text-xs text-gray-400">{tc.platformRevenueNote}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 w-fit">
          {(["transactions", "withdrawals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t === "transactions" ? tc.allTransactions : tc.withdrawalRequests}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-700">{tc.filter}</span>
          {tab === "transactions" ? (
            <>
              <select
                className="border rounded-lg px-3 py-1.5 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">{tc.allTypes}</option>
                {Object.entries(TX_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                className="border rounded-lg px-3 py-1.5 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">{tc.allStatuses}</option>
                {Object.entries(TX_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.text}</option>
                ))}
              </select>
            </>
          ) : (
            <select
              className="border rounded-lg px-3 py-1.5 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">{tc.allStatuses}</option>
              {Object.entries(WD_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.text}</option>
              ))}
            </select>
          )}
          <button
            className="ml-auto px-4 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
            onClick={() => {
              if (tab === "transactions") loadTransactions();
              else loadWithdrawals();
            }}
          >
            🔄 {tc.refresh}
          </button>
        </div>

        {/* Transactions Table */}
        {tab === "transactions" && (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[
                      tc.colTxId,
                      tc.colUser,
                      tc.colType,
                      tc.colAmount,
                      tc.colStatus,
                      tc.colPortrait,
                      tc.colTime,
                    ].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">{tc.loading}</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">{tc.noData}</td></tr>
                  ) : (
                    transactions.map((tx) => {
                      const st = TX_STATUS[tx.status] ?? { text: tx.status, color: "text-gray-600 bg-gray-50" };
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[120px] truncate">{tx.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{tx.user.displayName ?? "—"}</p>
                            <p className="text-xs text-gray-400">{tx.user.email}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{TX_TYPE[tx.type] ?? tx.type}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(tx.amount, tx.currency)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${st.color}`}>{st.text}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">
                            {tx.authorization?.portrait?.title ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {txMeta && txMeta.totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                <span>{tc.total} {txMeta.total} {tc.records}</span>
                <div className="flex gap-2">
                  <button disabled={txMeta.page <= 1} className="px-3 py-1 border rounded disabled:opacity-40"
                    onClick={() => loadTransactions(txMeta.page - 1)}>{tc.prevPage}</button>
                  <button disabled={txMeta.page >= txMeta.totalPages} className="px-3 py-1 border rounded disabled:opacity-40"
                    onClick={() => loadTransactions(txMeta.page + 1)}>{tc.nextPage}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Withdrawals Table */}
        {tab === "withdrawals" && (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[
                      tc.colUser,
                      tc.colAmount,
                      tc.colBankInfo,
                      tc.colStatus,
                      tc.colApplyTime,
                      tc.colAction,
                    ].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">{tc.loading}</td></tr>
                  ) : withdrawals.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">{tc.noData}</td></tr>
                  ) : (
                    withdrawals.map((w) => {
                      const st = WD_STATUS[w.status] ?? { text: w.status, color: "text-gray-600 bg-gray-50" };
                      return (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{w.user.displayName ?? "—"}</p>
                            <p className="text-xs text-gray-400">{w.user.email}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(w.amount, w.currency)}</td>
                          <td className="px-4 py-3 text-gray-700">
                            <p className="text-sm">{w.bankName} ****{w.bankAccountLast4}</p>
                            <p className="text-xs text-gray-400">{w.accountHolder}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${st.color}`}>{st.text}</span>
                            {w.rejectionReason && (
                              <p className="text-xs text-red-500 mt-0.5 max-w-[120px] truncate">{w.rejectionReason}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(w.createdAt)}</td>
                          <td className="px-4 py-3">
                            {w.status === "PENDING" ? (
                              <div className="flex gap-2">
                                <button
                                  disabled={actionLoading === w.id}
                                  onClick={() => handleWithdrawalAction(w.id, "approve")}
                                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                  {tc.approve}
                                </button>
                                <button
                                  disabled={actionLoading === w.id}
                                  onClick={() => handleWithdrawalAction(w.id, "reject", tc.rejectReasonDefault)}
                                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                  {tc.reject}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {wdMeta && wdMeta.totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                <span>{tc.total} {wdMeta.total} {tc.records}</span>
                <div className="flex gap-2">
                  <button disabled={wdMeta.page <= 1} className="px-3 py-1 border rounded disabled:opacity-40"
                    onClick={() => loadWithdrawals(wdMeta.page - 1)}>{tc.prevPage}</button>
                  <button disabled={wdMeta.page >= wdMeta.totalPages} className="px-3 py-1 border rounded disabled:opacity-40"
                    onClick={() => loadWithdrawals(wdMeta.page + 1)}>{tc.nextPage}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}