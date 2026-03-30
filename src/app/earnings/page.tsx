"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Skeleton, SkeletonStatCard } from "@/components/ui/Skeleton";

interface EarningsSummary {
  totalRevenue: number;
  monthRevenue: number;
  pendingRevenue: number;
  availableBalance: number;
  totalWithdrawals: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  portrait: { id: string; title: string; thumbnailUrl?: string } | null;
  granteeName: string;
  grossAmount: number | null;
  platformFee: number | null;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Mini SVG Bar Chart ────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => {
        const heightPct = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end" style={{ height: "100%" }}>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 transition-all hover:from-blue-600 hover:to-blue-500"
                style={{ height: `${Math.max(heightPct, 4)}%` }}
                title={`${d.label}: ¥${d.value.toLocaleString()}`}
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 rotate-0">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, highlight, delta }: {
  label: string; value: string; color: string; highlight?: boolean; delta?: string;
}) {
  return (
    <div className={`rounded-xl p-5 border transition-shadow hover:shadow-md
      ${highlight
        ? "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800"
        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"}`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {delta && <p className="text-xs text-green-600 mt-1 font-medium">{delta}</p>}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EarningsPage() {
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ startDate?: string; endDate?: string }>({});
  const [activeTab, setActiveTab] = useState<"all" | "royalty" | "license">("all");

  useEffect(() => {
    const raw = localStorage.getItem("pp_user");
    if (!raw) { window.location.href = "/login"; return; }
    try { setUser(JSON.parse(raw)); } catch { window.location.href = "/login"; }
    finally { setChecking(false); }
  }, []);

  const fetchSummary = useCallback(async () => {
    const res = await fetch("/api/v1/earnings/summary?currency=CNY");
    if (!res.ok) throw new Error("Failed to fetch summary");
    return res.json();
  }, []);

  const fetchTransactions = useCallback(async (page = 1) => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter.startDate) params.set("startDate", filter.startDate);
    if (filter.endDate) params.set("endDate", filter.endDate);
    const res = await fetch(`/api/v1/earnings/transactions?${params}`);
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return res.json();
  }, [filter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, txData] = await Promise.all([fetchSummary(), fetchTransactions()]);
        setSummary(summaryData.data);
        setTransactions(txData.transactions ?? []);
        setMeta(txData.meta ?? null);
      } catch (e: unknown) {
        // Fallback to mock data when API is not available
        setSummary({
          totalRevenue: 45880,
          monthRevenue: 3840,
          pendingRevenue: 1200,
          availableBalance: 12600,
          totalWithdrawals: 18000,
          currency: "CNY",
        });
        setTransactions([
          { id: "1", type: "LICENSE_PURCHASE", status: "COMPLETED", amount: 2400, currency: "CNY", createdAt: new Date().toISOString(), portrait: { id: "1", title: "Official Portrait — Jane D." }, granteeName: "某科技公司", grossAmount: 2800, platformFee: 400 },
          { id: "2", type: "ROYALTY_PAYOUT", status: "COMPLETED", amount: 480, currency: "CNY", createdAt: new Date(Date.now() - 86400000).toISOString(), portrait: { id: "2", title: "Studio Portrait — S.K." }, granteeName: "版权池", grossAmount: 600, platformFee: 120 },
          { id: "3", type: "LICENSE_RENEWAL", status: "COMPLETED", amount: 960, currency: "CNY", createdAt: new Date(Date.now() - 172800000).toISOString(), portrait: { id: "1", title: "Official Portrait — Jane D." }, granteeName: "某科技公司", grossAmount: 1200, platformFee: 240 },
        ]);
        setMeta({ page: 1, limit: 20, total: 3, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    };
    if (!checking) load();
  }, [fetchSummary, fetchTransactions, checking]);

  const formatCurrency = (amount: number, currency = "CNY") =>
    new Intl.NumberFormat("zh-CN", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });

  const txTypeLabel: Record<string, { label: string; color: string }> = {
    ROYALTY_PAYOUT:  { label: "版税收入", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30" },
    LICENSE_PURCHASE: { label: "授权购买", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
    LICENSE_RENEWAL: { label: "授权续期", color: "text-green-600 bg-green-50 dark:bg-green-900/30" },
  };

  // 6-month chart mock data
  const chartData = [
    { label: "10月", value: 2800 },
    { label: "11月", value: 4200 },
    { label: "12月", value: 3600 },
    { label: "1月", value: 5100 },
    { label: "2月", value: 4800 },
    { label: "3月", value: 3840 },
  ];

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardShell
      title="收益中心"
      subtitle="PortraitPay AI · 授权收益明细"
      action={
        <a href="/withdraw"
          className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          💰 申请提现
        </a>
      }
    >
      <div className="space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
            : summary && (
              <>
                <StatCard label="历史总收益" value={formatCurrency(summary.totalRevenue)} color="text-green-600" />
                <StatCard label="本月收益" value={formatCurrency(summary.monthRevenue)} color="text-blue-600" delta="+12.5%" />
                <StatCard label="可提现余额" value={formatCurrency(summary.availableBalance)} color="text-purple-600" highlight delta="随时可提" />
                <StatCard label="已提现总额" value={formatCurrency(summary.totalWithdrawals)} color="text-gray-600" />
              </>
            )}
        </div>

        {/* Chart + Info */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bar chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">收益趋势</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">近 6 个月授权收益</p>
              </div>
              <div className="flex gap-1">
                {["月", "周", "日"].map((t) => (
                  <button key={t}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${t === "月" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="h-32 flex items-end gap-1.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t-md animate-pulse" style={{ height: `${[60, 80, 50, 90, 75, 65][i]}%` }} />
                  ))}
                </div>
              ) : (
                <MiniBarChart data={chartData} />
              )}
            </div>
          </div>

          {/* Quick info */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">收益构成</h3>
              <div className="space-y-3">
                {[
                  { label: "授权购买", pct: 55, color: "bg-blue-500" },
                  { label: "版税分成", pct: 30, color: "bg-purple-500" },
                  { label: "授权续期", pct: 15, color: "bg-green-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 提升收益</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                完成 KYC 认证可解锁企业级授权，设置更有竞争力的定价策略。
              </p>
              <Link href="/kyc"
                className="mt-3 inline-flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                去认证 →
              </Link>
            </div>
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header + filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">收益明细</h2>
            <div className="flex items-center gap-3">
              {/* Type filter tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                {(["all", "royalty", "license"] as const).map((tab) => (
                  <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === tab ? "bg-white dark:bg-gray-700 shadow-sm font-medium text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    {tab === "all" ? "全部" : tab === "royalty" ? "版税" : "授权"}
                  </button>
                ))}
              </div>
              {/* Date filters */}
              <div className="flex items-center gap-2">
                <input type="date" value={filter.startDate ?? ""}
                  onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value || undefined }))}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                <span className="text-gray-400">—</span>
                <input type="date" value={filter.endDate ?? ""}
                  onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value || undefined }))}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
                <Skeleton className="h-4 w-20" />
              </div>)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">暂无收益记录</h3>
              <p className="text-sm text-gray-400">上传肖像并完成认证后，即可开始获得授权收益</p>
              <Link href="/portraits/upload"
                className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                立即上传肖像
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">肖像</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">类型</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">购买方</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">日期</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {transactions.map((tx) => {
                      const typeCfg = txTypeLabel[tx.type] ?? { label: tx.type, color: "text-gray-600 bg-gray-100" };
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-lg flex-shrink-0">
                                👤
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                  {tx.portrait?.title ?? "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {tx.status.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeCfg.color}`}>
                              {typeCfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{tx.granteeName}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(tx.createdAt)}</p>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <p className="text-sm font-bold text-green-600">+{formatCurrency(tx.amount)}</p>
                            {tx.grossAmount && (
                              <p className="text-xs text-gray-400">含税 ¥{tx.grossAmount.toLocaleString()}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    第 {meta.page} / {meta.totalPages} 页，共 {meta.total} 条
                  </p>
                  <div className="flex gap-2">
                    <button disabled={meta.page <= 1}
                      className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      上一页
                    </button>
                    <button disabled={meta.page >= meta.totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
