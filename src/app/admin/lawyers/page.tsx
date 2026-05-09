"use client";
/**
 * 管理员 - 律师楼入驻管理
 * /admin/lawyers
 * 审核律师楼注册申请
 */
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

interface LawyerRegistration {
  id: string;
  companyName: string;
  region: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  licenseUrl: string | null;
  status: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";
  reviewerId: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  reviewing: number;
  approved: number;
  rejected: number;
}

const BASE_STATUS_CONFIG: Record<
  LawyerRegistration["status"],
  { color: string; bg: string }
> = {
  PENDING: { color: "text-red-600", bg: "bg-red-50 border-red-200" },
  REVIEWING: { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  APPROVED: { color: "text-green-600", bg: "bg-green-50 border-green-200" },
  REJECTED: { color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

const BASE_FILTER_TABS: { key: LawyerRegistration["status"] | "ALL" }[] = [
  { key: "ALL" },
  { key: "PENDING" },
  { key: "REVIEWING" },
  { key: "APPROVED" },
  { key: "REJECTED" },
];

export default function AdminLawyersPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();

  const tc = t.adminLawyers || {} as Record<string, string>;
  const STATUS_CONFIG: Record<LawyerRegistration["status"], { label: string; color: string; bg: string }> = {
    PENDING: { label: tc.pending || "Pending", color: BASE_STATUS_CONFIG.PENDING.color, bg: BASE_STATUS_CONFIG.PENDING.bg },
    REVIEWING: { label: tc.reviewing || "Reviewing", color: BASE_STATUS_CONFIG.REVIEWING.color, bg: BASE_STATUS_CONFIG.REVIEWING.bg },
    APPROVED: { label: tc.approved || "Approved", color: BASE_STATUS_CONFIG.APPROVED.color, bg: BASE_STATUS_CONFIG.APPROVED.bg },
    REJECTED: { label: tc.rejected || "Rejected", color: BASE_STATUS_CONFIG.REJECTED.color, bg: BASE_STATUS_CONFIG.REJECTED.bg },
  };
  const FILTER_TABS = BASE_FILTER_TABS.map((t) => ({
    key: t.key,
    label: t.key === "ALL" ? (tc.all || "All") : STATUS_CONFIG[t.key as LawyerRegistration["status"]]?.label || t.key,
  }));

  const [registrations, setRegistrations] = useState<LawyerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const totalPages = Math.ceil(total / pageSize);

  const [filterStatus, setFilterStatus] = useState<LawyerRegistration["status"] | "ALL">("ALL");

  const [selected, setSelected] = useState<LawyerRegistration | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(pageNum), pageSize: String(pageSize) });
        if (filterStatus !== "ALL") params.set("status", filterStatus);

        const token = localStorage.getItem("pp_access_token");
        const res = await fetch(`/api/admin/lawyers?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();

        if (!res.ok || json.status === 401 || (json.success === false && json.error?.includes("Unauthorized"))) {
          router.push("/login");
          return;
        }

        if (json.success) {
          setRegistrations(json.data.registrations ?? []);
          setTotal(json.data.total ?? 0);
          setStats(json.data.stats ?? null);
          setPage(pageNum);
        }
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterStatus]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  async function handleApprove(id: string) {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/admin/lawyers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const json = await res.json();
      if (json.success) {
        setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, ...json.data } : r)));
        setSelected((prev) => (prev?.id === id ? { ...prev, ...json.data } : prev));
        load(page);
      } else {
        alert(json.error ?? tc.operationFailed);
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string, reason: string) {
    if (!reason.trim()) {
      alert(tc.pleaseEnterRejectReason);
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/admin/lawyers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "REJECT", rejectionReason: reason }),
      });
      const json = await res.json();
      if (json.success) {
        setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, ...json.data } : r)));
        setSelected((prev) => (prev?.id === id ? { ...prev, ...json.data } : prev));
        setRejectReason("");
        load(page);
      } else {
        alert(json.error ?? tc.operationFailed);
      }
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString(locale === "zh-CN" || locale === "zh-Hant" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function openDetail(r: LawyerRegistration) {
    setSelected(r);
    setRejectReason("");
  }

  function closeDetail() {
    setSelected(null);
    setRejectReason("");
  }

  const isActionable = (r: LawyerRegistration) =>
    r.status === "PENDING" || r.status === "REVIEWING";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← {tc.backToConsole}
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <h1 className="text-lg font-bold text-gray-900">
            {tc.pageTitle}
          </h1>
          <span className="ml-auto text-xs text-gray-400">
            {tc.totalRecords} {total} {tc.records}
          </span>
          <div className="flex items-center gap-2 ml-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: "ALL", label: tc.all, count: stats.total, color: null },
              { key: "PENDING", label: tc.pending, count: stats.pending, color: "text-red-600" },
              { key: "REVIEWING", label: tc.reviewing, count: stats.reviewing, color: "text-yellow-600" },
              { key: "APPROVED", label: tc.approved, count: stats.approved, color: "text-green-600" },
              { key: "REJECTED", label: tc.rejected, count: stats.rejected, color: "text-gray-500" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilterStatus(s.key as LawyerRegistration["status"] | "ALL")}
                className={`bg-white rounded-xl p-4 border text-left transition ${
                  filterStatus === s.key
                    ? "border-purple-400 ring-1 ring-purple-100"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className={`text-xs text-gray-500 mb-1 ${(s as any).color ?? ""}`}>{s.label}</div>
                <div className={`text-2xl font-bold ${(s as any).color ?? "text-gray-900"}`}>
                  {s.count ?? 0}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl w-fit">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterStatus(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === t.key
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[
                    tc.colCompanyName,
                    tc.colRegion,
                    tc.colContact,
                    tc.colPhone,
                    tc.colEmail,
                    tc.colStatus,
                    tc.colApplyTime,
                    tc.colAction,
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      {tc.loading}
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      {tc.noData}
                    </td>
                  </tr>
                ) : (
                  registrations.map((r) => {
                    const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG["PENDING"];
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => openDetail(r)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                          {r.companyName}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{r.region}</td>
                        <td className="px-4 py-3 text-gray-700">{r.contactName}</td>
                        <td className="px-4 py-3 text-gray-700">{r.contactPhone}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">
                          {r.contactEmail}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st.bg} ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(r.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(r);
                            }}
                          >
                            {tc.viewDetail}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>
                {tc.totalRecords2} {total} {tc.records}，{tc.page} {page} / {totalPages} {tc.pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  onClick={() => load(page - 1)}
                >
                  {tc.prevPage}
                </button>
                <button
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  onClick={() => load(page + 1)}
                >
                  {tc.nextPage}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">
                  {tc.lawyerFirmDetail}
                </span>
                {(() => {
                  const st = STATUS_CONFIG[selected.status];
                  return (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st.bg} ${st.color}`}
                    >
                      {st.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-gray-400">{formatDate(selected.createdAt)}</span>
              </div>
              <button
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Company info */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  [tc.companyName, selected.companyName],
                  [tc.region, selected.region],
                  [tc.contactPerson, selected.contactName],
                  [tc.phone, selected.contactPhone],
                  [tc.email, selected.contactEmail],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* License */}
              {selected.licenseUrl && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tc.qualificationCert}</p>
                  <a
                    href={selected.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition"
                  >
                    🔗 {tc.viewQualification}
                  </a>
                </div>
              )}

              {/* Rejection reason */}
              {selected.rejectionReason && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tc.rejectReason}</p>
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4 whitespace-pre-wrap">
                    {selected.rejectionReason}
                  </p>
                </div>
              )}

              {/* Reviewer info */}
              {selected.reviewerId && (
                <div className="text-xs text-gray-400 space-y-1">
                  <p>{tc.reviewerId}：{selected.reviewerId}</p>
                  <p>{tc.reviewTime}：{selected.reviewedAt ? formatDate(selected.reviewedAt) : "—"}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
                <p>{tc.applyTime}：{formatDate(selected.createdAt)}</p>
                <p>{tc.updateTime}：{formatDate(selected.updatedAt)}</p>
              </div>

              {/* Action buttons — only for PENDING / REVIEWING */}
              {isActionable(selected) && (
                <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selected.id)}
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition"
                    >
                      {actionLoading ? tc.processing : `✅ ${tc.approve}`}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt(tc.pleaseEnterRejectReason);
                        if (reason) handleReject(selected.id, reason);
                      }}
                      disabled={actionLoading}
                      className="px-6 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-60 transition"
                    >
                      ❌ {tc.reject}
                    </button>
                  </div>
                </div>
              )}

              {/* Reject reason inline input */}
              {isActionable(selected) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {tc.rejectReasonOptional}
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={tc.rejectReasonPlaceholder}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  {rejectReason.trim() && (
                    <button
                      onClick={() => handleReject(selected.id, rejectReason)}
                      disabled={actionLoading}
                      className="mt-2 px-5 py-2 border border-red-300 text-red-600 rounded-xl text-xs font-medium hover:bg-red-50 disabled:opacity-60 transition"
                    >
                      {tc.submitReject}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}