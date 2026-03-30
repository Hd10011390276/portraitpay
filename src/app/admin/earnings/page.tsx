/**
 * /admin/earnings — Admin Revenue Management Dashboard
 * View all transactions, withdrawals, and platform analytics
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  LICENSE_PURCHASE: "授权购买",
  LICENSE_RENEWAL: "续期",
  ROYALTY_PAYOUT: "版税分成",
  PLATFORM_COMMISSION: "平台佣金",
  WITHDRAWAL: "提现",
  SETTLEMENT: "结算",
};

const TX_STATUS: Record<string, { text: string; color: string }> = {
  PENDING: { text: "待处理", color: "text-yellow-600 bg-yellow-50" },
  COMPLETED: { text: "已完成", color: "text-green-600 bg-green-50" },
  FAILED: { text: "失败", color: "text-red-600 bg-red-50" },
  REFUNDED: { text: "已退款", color: "text-orange-600 bg-orange-50" },
  DISPUTED: { text: "争议中", color: "text-purple-600 bg-purple-50" },
};

const WD_STATUS: Record<string, { text: string; color: string }> = {
  PENDING: { text: "待审核", color: "text-yellow-600 bg-yellow-50" },
  PROCESSING: { text: "处理中", color: "text-blue-600 bg-blue-50" },
  APPROVED: { text: "已通过", color: "text-green-600 bg-green-50" },
  REJECTED: { text: "已拒绝", color: "text-red-600 bg-red-50" },
  COMPLETED: { text: "已完成", color: "text-gray-600 bg-gray-50" },
  FAILED: { text: "失败", color: "text-red-600 bg-red-50" },
};

export default function AdminEarningsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"transactions" | "withdrawals">("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [txMeta, setTxMeta] = useState<{ page: number; totalPages: number; total: number } | null>(null);
  const [wdMeta, setWdMeta] = useState<{ page: number; totalPages: number; total: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
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

  const formatCurrency = (v: number, c = "CNY") =>
    new Intl.NumberFormat("zh-CN", { style: "currency", currency: c }).format(v);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-700">←</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">收益管理</h1>
            <p className="text-sm text-gray-500">管理员后台 · 交易记录与提现审核</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">待处理提现</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount} 笔</p>
              <p className="text-sm text-gray-600">{formatCurrency(stats.totalPendingAmount)}</p>
            </div>
            <div className="bg-white rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">已成功提现</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalWithdrawnAmount)}</p>
            </div>
            <div className="bg-white rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">平台总收入</p>
              <p className="text-2xl font-bold text-blue-600">—</p>
              <p className="text-xs text-gray-400">（从 PLATFORM_COMMISSION 交易汇总）</p>
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
              {t === "transactions" ? "所有交易" : "提现申请"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-700">筛选</span>
          {tab === "transactions" ? (
            <>
              <select
                className="border rounded-lg px-3 py-1.5 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">全部类型</option>
                {Object.entries(TX_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                className="border rounded-lg px-3 py-1.5 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">全部状态</option>
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
              <option value="">全部状态</option>
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
            刷新
          </button>
        </div>

        {/* Transactions Table */}
        {tab === "transactions" && (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["交易ID", "用户", "类型", "金额", "状态", "关联肖像", "时间", "Stripe ID"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">加载中...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">暂无数据</td></tr>
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
                          <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[100px] truncate">
                            {tx.stripePaymentIntentId ?? "—"}
                          </td>
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
                <span>共 {txMeta.total} 条</span>
                <div className="flex gap-2">
                  <button disabled={txMeta.page <= 1} className="px-3 py-1 border rounded disabled:opacity-40"
                    onClick={() => loadTransactions(txMeta.page - 1)}>上一页</button>
                  <button disabled={txMeta.page >= txMeta.totalPages} className="px-3 py-1 border rounded disabled:opacity-40"
                    onClick={() => loadTransactions(txMeta.page + 1)}>下一页</button>
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
                    {["用户", "金额", "收款信息", "状态", "申请时间", "操作"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">加载中...</td></tr>
                  ) : withdrawals.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">暂无数据</td></tr>
                  ) : (
                    withdrawals.map((w) => {
                      const st = WD_STATUS[w.status] ?? { text: w.status, color: "text-gray-600 bg-gray-50" };
                      return (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{w.user.displayName ?? "—"}</p>
                            <p className="text-xs text-gray-400">{w.user.email}</p>
                            <span className="text-xs text-gray-400">KYC: {w.user.kycStatus}</span>
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
                                  通过
                                </button>
                                <button
                                  disabled={actionLoading === w.id}
                                  onClick={() => handleWithdrawalAction(w.id, "reject", "信息审核不通过")}
                                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                  拒绝
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
                <span>共 {wdMeta.total} 条</span>
                <div className="flex gap-2">
                  <button disabled={wdMeta.page <= 1} className="px-3 py-1 border rounded disabled:opacity-40"
                    onClick={() => loadWithdrawals(wdMeta.page - 1)}>上一页</button>
                  <button disabled={wdMeta.page >= wdMeta.totalPages} className="px-3 py-1 border rounded disabled:opacity-40"
                    onClick={() => loadWithdrawals(wdMeta.page + 1)}>下一页</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
